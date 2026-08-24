import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import { renderInPlayer } from "../testComponents";

/**
 * The element carries one handler now, and it is policy rather than projection:
 * `onEnded`. Everything else it used to wire — ten JSX handlers pushing state
 * sideways — is `syncFromElement`'s, attached by `attach` rather than by React.
 */
describe("AudioElement", () => {
  it("renders with proper accessibility attributes", () => {
    renderInPlayer(<AudioElement />);

    expect(screen.getByLabelText("audio player")).toHaveAttribute(
      "aria-label",
      "audio player",
    );
  });

  it("sets the src from the config's first audio file", () => {
    renderInPlayer(<AudioElement />, {
      audioFiles: [{ src: "test-audio.mp3" }],
    });

    expect(screen.getByLabelText("audio player")).toHaveAttribute(
      "src",
      "test-audio.mp3",
    );
  });

  it("handles the case when no audio files are provided", () => {
    renderInPlayer(<AudioElement />, { audioFiles: [] });

    expect(screen.getByLabelText("audio player")).not.toHaveAttribute("src");
  });

  /**
   * The `ended` policy. The element used to sit at `duration` while the thumb was
   * pushed to 0, so the clock and the thumb disagreed on screen. Moving the
   * element instead makes them agree.
   */
  it("returns the element to the start when playback ends", () => {
    renderInPlayer(<AudioElement />);
    const audio = screen.getByLabelText("audio player") as HTMLAudioElement;
    // jsdom's `<audio>` is inert, so assign a time the handler can reset.
    Object.defineProperty(audio, "currentTime", { value: 100, writable: true });

    audio.dispatchEvent(new Event("ended"));

    expect(audio.currentTime).toBe(0);
  });

  it("attaches the element to the store once, across parent rerenders", () => {
    const { store, rerender } = renderInPlayer(<AudioElement />);
    const attach = vi.spyOn(store, "attach");

    rerender(<AudioElement />);

    expect(attach).not.toHaveBeenCalled();
  });
});
