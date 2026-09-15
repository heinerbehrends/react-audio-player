import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayButton } from "../../src/Player/PlayButton";
import { MuteButton } from "../../src/Player/MuteButton";
import { SeekButton } from "../../src/Player/SeekButton";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { SetPlaybackRate } from "../../src/PlaybackRate/SetPlaybackRate";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaElementFake } from "../store/mediaElementFake";

/**
 * S24. `useComposedButtonProps` is tested on its own; a correct hook does not
 * prove `PlayButton` calls it, or spreads it last. That wiring is the actual
 * failure mode, so all six are checked the same way.
 *
 * The keydown half is uniform — the keymap is player-wide, so `p` sends
 * `TOGGLE_PLAY` from every one of them. The click half is not, so each row
 * carries its own assertion.
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const buttons: {
  name: string;
  render: (props: ButtonProps) => React.ReactElement;
  expectAction: (element: MediaElementFake) => void;
}[] = [
  {
    name: "PlayButton",
    render: (props) => <PlayButton {...props}>play</PlayButton>,
    expectAction: (element) => expect(element.play).toHaveBeenCalled(),
  },
  {
    name: "MuteButton",
    render: (props) => <MuteButton {...props}>mute</MuteButton>,
    expectAction: (element) => expect(element.muted).toBe(true),
  },
  {
    name: "SeekButton",
    render: (props) => (
      <SeekButton amount={10} {...props}>
        seek
      </SeekButton>
    ),
    expectAction: (element) => expect(element.currentTime).toBe(10),
  },
  {
    name: "Time.Toggle",
    render: (props) => <Time.Toggle {...props}>toggle</Time.Toggle>,
    // The one whose action is store-only: the name flips instead.
    expectAction: () =>
      expect(
        screen.getByRole("button", { name: "Show time elapsed" }),
      ).toBeInTheDocument(),
  },
  {
    name: "PlaybackRate.Set",
    render: (props) => (
      <SetPlaybackRate rate={1.5} {...props}>
        1.5x
      </SetPlaybackRate>
    ),
    expectAction: (element) => expect(element.playbackRate).toBe(1.5),
  },
  {
    name: "PlaybackRate.Change",
    render: (props) => (
      <ChangePlaybackRate amount={0.25} {...props}>
        faster
      </ChangePlaybackRate>
    ),
    expectAction: (element) => expect(element.playbackRate).toBe(1.25),
  },
];

describe.each(buttons)("$name", ({ render, expectAction }) => {
  it("runs the consumer's onClick alongside its own action", () => {
    const theirs = vi.fn();
    const { element } = renderWithStore(render({ onClick: theirs }), {
      element: { readyState: 1, duration: 100 },
    });

    fireEvent.click(screen.getByRole("button"));

    expect(theirs).toHaveBeenCalled();
    expectAction(element);
  });

  it("runs the consumer's onKeyDown alongside the media keys", () => {
    const theirs = vi.fn();
    const { element } = renderWithStore(render({ onKeyDown: theirs }), {
      element: { readyState: 1, duration: 100, paused: true },
    });

    fireEvent.keyDown(screen.getByRole("button"), { key: "p" });

    expect(theirs).toHaveBeenCalled();
    expect(element.play).toHaveBeenCalled();
  });

  /**
   * The trap `handleMediaKeys` already avoids by omitting `Space`: on a
   * `<button>`, `preventDefault()` on keydown is how `Enter` and `Space`
   * activation is cancelled. Neither key is bound, so neither is cancelled —
   * `fireEvent` returns false when the event was.
   */
  it.each(["Enter", " "])("leaves %s free to activate the button", (key) => {
    const theirs = vi.fn();
    renderWithStore(render({ onKeyDown: theirs }), {
      element: { readyState: 1, duration: 100 },
    });

    const notCancelled = fireEvent.keyDown(screen.getByRole("button"), { key });

    expect(theirs).toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });
});
