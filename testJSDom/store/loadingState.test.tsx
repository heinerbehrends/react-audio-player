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
 * Two gates, keyed on different things.
 *
 * **Error** disables every control — the resource is unusable, so nothing would
 * work.
 *
 * **Seekability**, a known non-zero duration, disables only the controls that
 * name a position on the track: `SeekButton` here, and the timeline slider in
 * `useSlider.test.tsx`.
 *
 * **Loading disables nothing.** `play()` at `readyState: 0` is legal and the
 * browser queues it, and `volume`, `muted` and `playbackRate` are settable
 * before metadata. The accessible name says "Loading audio" instead (A4).
 *
 * In jsdom rather than E2E: loading is racy in a real browser and deterministic
 * here. The fake also lets `readyState` and `duration` be set independently,
 * which a real element does not — that is what separates the two predicates.
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
const seekName = /^Seek forward/;

describe("the error gate", () => {
  it("marks all six aria-disabled", () => {
    renderWithStore(renderAll(), { element: { error: {} as MediaError } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });
  });

  it("leaves all six unmarked on a ready, seekable player", () => {
    renderWithStore(renderAll(), {
      element: { readyState: 1, duration: 100 },
    });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) =>
      expect(button).not.toHaveAttribute("aria-disabled"),
    );
  });

  /**
   * An autoplay refusal is not a media error: the resource is fine and a user
   * gesture is what lifts it, so a disabled Play button would make recovery
   * impossible.
   */
  it("does not fire for a refused play()", () => {
    const { element } = renderWithStore(renderAll(), {
      element: { readyState: 1, duration: 100 },
    });
    element.play.mockRejectedValueOnce(
      new DOMException("blocked", "NotAllowedError"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));

    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).not.toHaveAttribute("aria-disabled"));
  });
});

describe("loading, on its own", () => {
  /**
   * The regression this exists to catch. A gate on the load state disabled Play
   * before metadata — and because changing `audioFile.src` re-enters loading, it
   * did so on every playlist advance, not only at startup.
   */
  it("leaves the five non-seeking controls enabled", () => {
    renderWithStore(renderAll(), { element: { readyState: 0, duration: 0 } });

    const enabled = screen
      .getAllByRole("button")
      .filter(
        (button) => !seekName.test(button.getAttribute("aria-label") ?? ""),
      );

    expect(enabled).toHaveLength(expectedCount - 1);
    enabled.forEach((button) =>
      expect(button).not.toHaveAttribute("aria-disabled"),
    );
  });

  it("still lets Play reach the element, which queues it", () => {
    const { element } = renderWithStore(renderAll(), {
      element: { readyState: 0, duration: 0 },
    });

    fireEvent.click(screen.getByRole("button", { name: "Loading audio" }));

    expect(element.play).toHaveBeenCalled();
  });

  it("still lets the volume and rate controls write the element", () => {
    const { element } = renderWithStore(renderAll(), {
      element: { readyState: 0, duration: 0, muted: false },
    });

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(element.muted).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /^Set playback rate/ }));
    expect(element.playbackRate).toBe(1.5);
  });

  /** A4: the state is on the name, which is where it was already. */
  it("says so on the accessible name instead", () => {
    renderWithStore(renderAll(), { element: { readyState: 0, duration: 0 } });

    expect(
      screen.getByRole("button", { name: "Loading audio" }),
    ).toBeInTheDocument();
  });
});

describe("the seekable gate", () => {
  /**
   * Both directions: `SeekButton` sends `SET_TIME_FORWARD` with a negative value
   * rather than `SET_TIME_BACKWARD`, so a rewind reads `el.duration` too.
   */
  it.each([10, -10])(
    "marks a %i-second SeekButton aria-disabled without a duration",
    (amount) => {
      renderWithStore(<SeekButton amount={amount}>seek</SeekButton>, {
        element: { readyState: 0, duration: 0 },
      });
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    },
  );

  /**
   * The case no load-state check reaches: `readyState` is at its maximum and the
   * element is playing, but a live stream has no end to seek towards.
   */
  it("marks it aria-disabled on a healthy live stream", () => {
    renderWithStore(<SeekButton amount={10}>seek</SeekButton>, {
      element: { readyState: 4, paused: false, duration: Infinity },
    });

    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not activate while unseekable, the consumer's handler included", () => {
    let theirs = 0;
    const { element } = renderWithStore(
      <SeekButton amount={10} onClick={() => theirs++}>
        seek
      </SeekButton>,
      { element: { readyState: 0, duration: 0, currentTime: 0 } },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(element.currentTime).toBe(0);
    expect(theirs).toBe(0);
  });

  it("releases when durationchange brings a duration", () => {
    const { element, emit } = renderWithStore(
      <SeekButton amount={10}>seek</SeekButton>,
      { element: { readyState: 0, duration: 0, currentTime: 0 } },
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");

    element.duration = 100;
    emit("durationchange");

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled");

    fireEvent.click(screen.getByRole("button"));
    expect(element.currentTime).toBe(10);
  });

  it("runs the consumer's handler in place of ours once seekable", () => {
    let theirs = 0;
    const { element } = renderWithStore(
      <SeekButton amount={10} onClick={() => theirs++}>
        seek
      </SeekButton>,
      { element: { readyState: 1, duration: 100, currentTime: 0 } },
    );

    fireEvent.click(screen.getByRole("button"));

    expect(theirs).toBe(1);
    // A spread `onClick` replaces the library's, as it did before the gate.
    expect(element.currentTime).toBe(0);
  });
});

/**
 * A7. Under native `disabled` the browser removes the focused element from the
 * tab order and focus falls to `<body>`, so the next Tab restarts from the top
 * of the document.
 */
describe("focus survives a state change", () => {
  it("keeps focus on a control that becomes disabled mid-session", () => {
    const { element, emit } = renderWithStore(renderAll(), {
      element: { readyState: 1, duration: 100 },
    });
    const seek = screen.getByRole("button", { name: seekName });
    seek.focus();
    expect(seek).toHaveFocus();

    // A real `src` swap: the media load algorithm re-primes, which drops the
    // duration as well as the ready state.
    element.readyState = 0;
    element.duration = NaN;
    emit("emptied");

    expect(seek).toHaveAttribute("aria-disabled", "true");
    expect(seek).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it("keeps focus when an error disables a control under it", () => {
    const { element, emit } = renderWithStore(renderAll(), {
      element: { readyState: 1, duration: 100 },
    });
    const play = screen.getByRole("button", { name: "Play audio" });
    play.focus();

    element.error = {} as MediaError;
    emit("error");

    expect(play).toHaveAttribute("aria-disabled", "true");
    expect(play).toHaveFocus();
  });
});
