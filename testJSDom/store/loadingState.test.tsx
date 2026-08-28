import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayButton } from "../../src/Player/PlayButton";
import { MuteButton } from "../../src/Player/MuteButton";
import { SeekButton } from "../../src/Player/SeekButton";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { SetPlaybackRate } from "../../src/PlaybackRate/SetPlaybackRate";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { renderWithStore } from "./renderWithStore";

/**
 * `useIsDisabled` gates six components on the load state. Tested in jsdom rather
 * than E2E because loading is transient and racy in a real browser and
 * deterministic here: leave the fake at `readyState: 0` and all six are
 * disabled.
 *
 * The gate is `aria-disabled`, not native `disabled`, so the tab stop survives
 * a load-state change under a focused control. `useDisabledButtonProps` has the
 * reasoning.
 */
function renderAll() {
  return (
    <>
      <PlayButton>play</PlayButton>
      <MuteButton>mute</MuteButton>
      <SeekButton amount={10}>seek</SeekButton>
      <Time.Toggle>toggle</Time.Toggle>
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>
      <ChangePlaybackRate amount={0.25}>faster</ChangePlaybackRate>
    </>
  );
}

const expectedCount = 6;

describe("the loading gate", () => {
  it("marks all six aria-disabled before metadata arrives", () => {
    renderWithStore(renderAll(), { element: { readyState: 0 } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });
  });

  it("marks all six aria-disabled on an error", () => {
    renderWithStore(renderAll(), { element: { error: {} as MediaError } });

    screen.getAllByRole("button").forEach((button) => {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });
  });

  it("leaves all six unmarked once the element is ready", () => {
    renderWithStore(renderAll(), { element: { readyState: 1 } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) =>
      expect(button).not.toHaveAttribute("aria-disabled"),
    );
  });

  it("releases the gate when loadedmetadata arrives", () => {
    const { element, emit } = renderWithStore(renderAll(), {
      element: { readyState: 0 },
    });
    expect(screen.getAllByRole("button")[0]).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    element.readyState = 1;
    emit("loadedmetadata");

    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).not.toHaveAttribute("aria-disabled"));
  });

  /**
   * A7. Under native `disabled` the browser removes the element from the tab
   * order and focus falls to `<body>`, so the next Tab restarts from the top of
   * the document.
   */
  it("keeps focus on a control that becomes disabled mid-session", () => {
    const { element, emit } = renderWithStore(renderAll(), {
      element: { readyState: 1 },
    });
    const seek = screen.getByRole("button", { name: /^Seek forward/ });
    seek.focus();
    expect(seek).toHaveFocus();

    element.readyState = 0;
    emit("emptied");

    expect(seek).toHaveAttribute("aria-disabled", "true");
    expect(seek).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  /**
   * `aria-disabled` is advisory, so the block is explicit — and covers the
   * consumer's handler, which native `disabled` blocked as well.
   */
  it("runs no click handler while disabled, the consumer's included", () => {
    let theirs = 0;
    const { element } = renderWithStore(
      <>
        <PlayButton>play</PlayButton>
        <SeekButton amount={10} onClick={() => theirs++}>
          seek
        </SeekButton>
      </>,
      { element: { readyState: 0, currentTime: 0 } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Loading audio" }));
    fireEvent.click(screen.getByRole("button", { name: /^Seek forward/ }));

    expect(element.play).not.toHaveBeenCalled();
    expect(element.currentTime).toBe(0);
    expect(theirs).toBe(0);
  });

  it("runs the consumer's handler in place of ours once ready", () => {
    let theirs = 0;
    const { element } = renderWithStore(
      <SeekButton amount={10} onClick={() => theirs++}>
        seek
      </SeekButton>,
      { element: { readyState: 1, currentTime: 0 } },
    );

    fireEvent.click(screen.getByRole("button", { name: /^Seek forward/ }));

    expect(theirs).toBe(1);
    // A spread `onClick` replaces the library's, as it did before the gate.
    expect(element.currentTime).toBe(0);
  });
});
