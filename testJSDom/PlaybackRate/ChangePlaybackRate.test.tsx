import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  ChangePlaybackRate,
  usePlaybackRateChangeProps,
} from "../../src/PlaybackRate/ChangePlaybackRate";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";

describe("ChangePlaybackRate", () => {
  const renderChange = (
    ui: React.ReactElement,
    element: Partial<MediaFields> = {},
  ) => renderWithStore(ui, { element });

  it("renders a button with correct text", () => {
    renderChange(
      <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Change Rate");
  });

  it("sets correct aria-label for increase", () => {
    renderChange(
      <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Increase playback rate by 0.25x",
    );
  });

  it("sets correct aria-label for decrease", () => {
    renderChange(
      <ChangePlaybackRate amount={-0.25}>Change Rate</ChangePlaybackRate>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Decrease playback rate by 0.25x",
    );
  });

  it("writes the element on click", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(1.25);
  });

  /**
   * Against the element, not a mock of the hook: mocking `useHandleMediaKeys`
   * passes even when the real handler does nothing (T9).
   */
  it("handles media keys, writing the element", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });
    expect(element.play).toHaveBeenCalled();

    // `>` is the global rate key, a different path from this button's own
    // `amount`: it steps 0.05, not 0.25.
    fireEvent.keyDown(button, { key: ">" });
    expect(element.playbackRate).toBeCloseTo(1.05, 10);
  });

  /**
   * `playbackRate` is settable before metadata, so loading is not a reason to
   * suppress this button. It was only ever disabled as collateral damage from a
   * gate meant for the timeline.
   */
  it("stays enabled and writable while the player is loading", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
      { readyState: 0, duration: 0 },
    );
    const button = screen.getByRole("button");

    expect(button).not.toHaveAttribute("aria-disabled");

    fireEvent.click(button);
    expect(element.playbackRate).toBe(1.25);
  });

  it("is aria-disabled on an error, and does not activate", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
      { readyState: 0, error: {} as MediaError },
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not native `disabled`: the tab stop has to survive (A7).
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(element.playbackRate).toBe(1);
  });

  it("accepts and applies additional props", () => {
    renderChange(
      <ChangePlaybackRate
        amount={0.25}
        data-testid="custom-button"
        className="custom-class"
      >
        Test
      </ChangePlaybackRate>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });

  it("adds the amount to the current rate", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 2 },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(2.5);
  });

  /**
   * The tearing hazard: reading `playbackRate` during render leaves the next
   * click computing from a stale value. The handler reads the element when the
   * click lands, so nothing rendered can be stale.
   */
  it("adds to the rate the element reports after a ratechange", () => {
    const { element, emit } = renderChange(
      <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 1 },
    );

    element.playbackRate = 2;
    emit("ratechange");

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(2.5);
  });

  /**
   * C8. The button steps through the same two actions as the `<` and `>` keys,
   * so all three stop at the library's ends — which is what the JSDoc and the
   * README had promised while the button was sending an unclamped set.
   */
  it.each([
    ["up", 1, 7.8, 8],
    ["down", -1, 0.3, 0.125],
  ])(
    "clamps %s to the library's 0.125–8 range, like the < and > keys",
    (_direction, amount, from, expected) => {
      const { element } = renderChange(
        <ChangePlaybackRate amount={amount}>Change Rate</ChangePlaybackRate>,
        { playbackRate: from },
      );

      fireEvent.click(screen.getByRole("button"));

      expect(element.playbackRate).toBe(expected);
    },
  );

  /**
   * C14. Clamping to the old 0.5–4 turned "increase" at 8x into a drop to 4x,
   * and "decrease" at 0.25x into a rise to 0.5x. Both now stop where they are.
   */
  it.each([
    ["Increase at 8x", 0.25, 8],
    ["Decrease at 0.125x", -0.25, 0.125],
    ["A step of 0 at 8x", 0, 8],
  ])("%s leaves the rate where it is", (_name, amount, from) => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={amount}>Change Rate</ChangePlaybackRate>,
      { playbackRate: from },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(from);
  });

  it("decreases from 8x rather than jumping to the slider's ceiling", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={-0.25}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 8 },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(7.75);
  });

  /**
   * C8. The rate is read off the element when the button is pressed, so there
   * is nothing for a `ratechange` to re-render. Counted on a component that
   * calls the hook, since a parent counter would not see the hook's own host.
   */
  it("does not re-render on a ratechange", () => {
    let renders = 0;
    function Probe() {
      renders += 1;
      return <button {...usePlaybackRateChangeProps(0.5)}>Change Rate</button>;
    }
    const { element, emit } = renderChange(<Probe />, { playbackRate: 1 });
    const before = renders;

    element.playbackRate = 2;
    emit("ratechange");

    expect(renders).toBe(before);
    // And the next click still computes from the element's current rate.
    fireEvent.click(screen.getByRole("button"));
    expect(element.playbackRate).toBe(2.5);
  });
});
