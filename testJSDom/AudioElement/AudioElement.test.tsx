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

// Mock the Track component
vi.mock("../../src/Captions/Track", () => ({
  Track: ({ src }: { src: string }) => (
    <track data-testid="caption-track" src={src} />
  ),
}));

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

    rerender(
      <PlayerContext.Provider value={createPlayerContext()}>
        <AudioContext.Provider value={contextWithRef}>
          <AudioElement />
        </AudioContext.Provider>
      </PlayerContext.Provider>,
    );

    expect(audio.ontimeupdate).toBe(initialTimeUpdateHandler);
    expect(audio.onvolumechange).toBe(initialVolumeChangeHandler);
  });

  it("renders with captions track when captionSrc is provided", () => {
    const contextWithCaptions = createPlayerContext({
      overrides: {
        audioFiles: [
          {
            src: "test-audio.mp3",
            captionSrc: "captions.vtt",
          },
        ],
      },
    });

    renderWithContexts({
      playerContext: contextWithCaptions,
      audioContext: createAudioContext(),
      component: <AudioElement />,
    });
    const track = screen.getByTestId("caption-track");
    expect(track).toBeInTheDocument();
    expect(track).toHaveAttribute("src", "captions.vtt");
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
});
