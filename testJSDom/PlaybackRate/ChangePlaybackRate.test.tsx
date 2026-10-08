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
   * C8, then F15. The button steps through the same two actions as the `<`
   * and `>` keys, so all three stop at the ends of the player's `rateRange`,
   * 0.5–4 by default — which is what the JSDoc and the README promise.
   */
  it.each([
    ["up", 1, 3.8, 4],
    ["down", -1, 0.7, 0.5],
  ])(
    "stops %s at the player's rateRange, like the < and > keys",
    (_direction, amount, from, expected) => {
      const { element } = renderChange(
        <ChangePlaybackRate amount={amount}>Change Rate</ChangePlaybackRate>,
        { playbackRate: from },
      );

      fireEvent.click(screen.getByRole("button"));

      expect(element.playbackRate).toBe(expected);
    },
  );

  it.each([
    ["Increase at 4x", 0.25, 4],
    ["Decrease at 0.5x", -0.25, 0.5],
    ["A step of 0 at 4x", 0, 4],
  ])("%s leaves the rate where it is", (_name, amount, from) => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={amount}>Change Rate</ChangePlaybackRate>,
      { playbackRate: from },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(from);
  });

  /**
   * F15. A rate past the range can only have been written through `audioRef`.
   * A step pulls it back to the range's end rather than leaving it there,
   * which is what C14's direction rule used to do when the slider's range and
   * the buttons' could differ.
   */
  it("pulls a rate written past the range back to its end", () => {
    const { element } = renderChange(
      <ChangePlaybackRate amount={-0.25}>Change Rate</ChangePlaybackRate>,
      { playbackRate: 8 },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.playbackRate).toBe(4);
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
