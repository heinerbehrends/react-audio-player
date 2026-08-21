import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import { PlayerContext } from "../../src/Player/PlayerContext";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import {
  createPlayerContext,
  createAudioContext,
  createMockAudioElement,
} from "../testUtils";
import { renderWithContexts } from "../testComponents";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";

describe("AudioElement", () => {
  let audioElement: HTMLAudioElement;

  beforeEach(() => {
    vi.clearAllMocks();
    audioElement = createMockAudioElement() as HTMLAudioElement;
  });

  it("only renders callbacks when they are defined in context", () => {
    const nullCallbacksContext = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: null } },
      volumeCallbackRef: { current: { handleVolumeAction: null } },
      playbackRateCallbackRef: { current: { handlePlaybackRateAction: null } },
    });

    renderWithContexts({
      playerContext: createPlayerContext(),
      audioContext: nullCallbacksContext,
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");

    expect(audio).not.toHaveAttribute("ontimeupdate");
    expect(audio).not.toHaveAttribute("onvolumechange");
    expect(audio).not.toHaveAttribute("onratechange");
  });

  it("handles the case when no audio files are provided", () => {
    const noAudioContext = createPlayerContext({
      overrides: {
        audioFiles: [],
      },
    });

    renderWithContexts({
      playerContext: noAudioContext,
      audioContext: createAudioContext(),
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");

    expect(audio).not.toHaveAttribute("src");
    expect(screen.queryByTestId("caption-track")).not.toBeInTheDocument();
  });

  it("correctly memoizes event handlers to prevent unnecessary rerenders", () => {
    const contextWithRef = createAudioContext({
      audioElementRef: { current: audioElement },
    });

    const { rerender } = renderWithContexts({
      playerContext: createPlayerContext(),
      audioContext: contextWithRef,
      component: <AudioElement />,
    });

    const audio = screen.getByLabelText("audio player");
    const initialTimeUpdateHandler = audio.ontimeupdate;
    const initialVolumeChangeHandler = audio.onvolumechange;

    // Same root component as `renderWithContexts` renders, so the store
    // instance survives the rerender.
    rerender(
      <PlayerStoreProvider>
        <AudioContext.Provider value={contextWithRef}>
          <PlayerContext.Provider value={createPlayerContext()}>
            <AudioElement />
          </PlayerContext.Provider>
        </AudioContext.Provider>
      </PlayerStoreProvider>,
    );

    expect(audio.ontimeupdate).toBe(initialTimeUpdateHandler);
    expect(audio.onvolumechange).toBe(initialVolumeChangeHandler);
  });

  it("sets the correct src from audioFiles when provided", () => {
    const contextWithAudioSrc = createPlayerContext({
      overrides: {
        audioFiles: [{ src: "test-audio.mp3" }],
      },
    });

    renderWithContexts({
      playerContext: contextWithAudioSrc,
      audioContext: createAudioContext(),
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");
    expect(audio).toHaveAttribute("src", "test-audio.mp3");
  });

  it("renders with proper accessibility attributes", () => {
    renderWithContexts({
      playerContext: createPlayerContext(),
      audioContext: createAudioContext(),
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");
    expect(audio).toHaveAttribute("aria-label", "audio player");
  });

  it("updates timeline max value when duration changes", () => {
    const mockTimelineAction = vi.fn();
    const mockAudioElement = { duration: 150 } as HTMLAudioElement;
    const audioContext = createAudioContext({
      audioElementRef: { current: mockAudioElement },
      timelineCallbackRef: {
        current: { handleTimelineAction: mockTimelineAction },
      },
    });

    renderWithContexts({
      playerContext: createPlayerContext(),
      audioContext: audioContext,
      component: <AudioElement />,
    });

    const audio = screen.getByLabelText("audio player");
    audio.dispatchEvent(new Event("durationchange"));

    expect(mockTimelineAction).toHaveBeenCalledWith({
      type: "SET_MAX_VALUE",
      maxValue: 100,
    });
  });
});
