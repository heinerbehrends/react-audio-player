import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import {
  AudioContext,
  AudioContextType,
} from "../../src/AudioElement/AudioContext";
import React from "react";

// Mock the Track component
vi.mock("../../src/Captions/Track", () => ({
  Track: ({ src }) => <track data-testid="caption-track" src={src} />,
}));

describe("AudioElement", () => {
  let audioElement;

  // Context setup omitted for brevity
  const defaultPlayerContextValue: PlayerContextType = {
    /* setup as before */
    handlePlayerAction: vi.fn(),
    playerState: "paused" as const,
    showCaptions: false,
    isMuted: false,
    audioFiles: [],
    cues: [],
    getPlayerState: vi.fn(),
    playbackRate: 1,
    volumeState: "high" as const,
    unmuteVolumeRef: { current: 0.5 },
    timeDisplay: "elapsed" as const,
  };
  const defaultAudioContextValue: AudioContextType = {
    /* setup as before */
    audioElementRef: { current: audioElement },
    handleSideEffect: vi.fn(),
    timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
    volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
    playbackRateCallbackRef: { current: { handlePlaybackRateAction: vi.fn() } },
  };

  const renderWithContexts = (
    playerCtx = defaultPlayerContextValue,
    audioCtx = defaultAudioContextValue,
  ) => {
    return render(
      <PlayerContext.Provider value={playerCtx}>
        <AudioContext.Provider value={audioCtx}>
          <AudioElement />
        </AudioContext.Provider>
      </PlayerContext.Provider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audioElement = document.createElement("audio");
    // Setup audioElement properties
  });

  // UNIT TESTS THAT COMPLEMENT E2E TESTING

  it("only renders callbacks when they are defined in context", () => {
    // Test with null callbacks
    const nullCallbacksContext = {
      ...defaultAudioContextValue,
      timelineCallbackRef: { current: { handleTimelineAction: null } },
      volumeCallbackRef: { current: { handleVolumeAction: null } },
      playbackRateCallbackRef: { current: { handlePlaybackRateAction: null } },
    };

    renderWithContexts(defaultPlayerContextValue, nullCallbacksContext);
    const audio = screen.getByLabelText("audio player");

    // Check that event handlers aren't attached when callbacks are null
    expect(audio).not.toHaveAttribute("ontimeupdate");
    expect(audio).not.toHaveAttribute("onvolumechange");
    expect(audio).not.toHaveAttribute("onratechange");
  });

  it("handles the case when no audio files are provided", () => {
    const noAudioContext = {
      ...defaultPlayerContextValue,
      audioFiles: [],
    };

    renderWithContexts(noAudioContext);
    const audio = screen.getByLabelText("audio player");

    expect(audio).not.toHaveAttribute("src");
    expect(screen.queryByTestId("caption-track")).not.toBeInTheDocument();
  });

  it("correctly memoizes event handlers to prevent unnecessary rerenders", () => {
    // Initialize with a reference we can track
    const contextWithRef = {
      ...defaultAudioContextValue,
      audioElementRef: { current: audioElement },
    };

    const { rerender } = renderWithContexts(
      defaultPlayerContextValue,
      contextWithRef,
    );

    // Get initial handler references
    const audio = screen.getByLabelText("audio player");
    const initialTimeUpdateHandler = audio.ontimeupdate;
    const initialVolumeChangeHandler = audio.onvolumechange;

    // Force a rerender with same props
    rerender(
      <PlayerContext.Provider value={defaultPlayerContextValue}>
        <AudioContext.Provider value={contextWithRef}>
          <AudioElement />
        </AudioContext.Provider>
      </PlayerContext.Provider>,
    );

    // Verify handlers are the same objects (memoized correctly)
    expect(audio.ontimeupdate).toBe(initialTimeUpdateHandler);
    expect(audio.onvolumechange).toBe(initialVolumeChangeHandler);
  });

  it("renders with captions track when captionSrc is provided", () => {
    const contextWithCaptions = {
      ...defaultPlayerContextValue,
      audioFiles: [
        {
          src: "test-audio.mp3",
          captionSrc: "captions.vtt",
        },
      ],
    };

    renderWithContexts(contextWithCaptions);
    const track = screen.getByTestId("caption-track");
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute("src", "captions.vtt");
  });

  it("sets the correct src from audioFiles when provided", () => {
    const contextWithAudioSrc = {
      ...defaultPlayerContextValue,
      audioFiles: [{ src: "test-audio.mp3" }],
    };

    renderWithContexts(contextWithAudioSrc);
    const audio = screen.getByLabelText("audio player");
    expect(audio).toHaveAttribute("src", "test-audio.mp3");
  });

  it("renders with proper accessibility attributes", () => {
    renderWithContexts();
    const audio = screen.getByLabelText("audio player");
    expect(audio).toHaveAttribute("aria-label", "audio player");
  });
});
