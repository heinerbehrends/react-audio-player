import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import { createAudioContext, createMockAudioElement } from "../testUtils";
import { renderWithContexts, TestProviders } from "../testComponents";

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
      audioContext: nullCallbacksContext,
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");

    expect(audio).not.toHaveAttribute("ontimeupdate");
    expect(audio).not.toHaveAttribute("onvolumechange");
    expect(audio).not.toHaveAttribute("onratechange");
  });

  it("handles the case when no audio files are provided", () => {
    renderWithContexts({
      audioContext: createAudioContext(),
      audioFiles: [],
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
      audioContext: contextWithRef,
      component: <AudioElement />,
    });

    const audio = screen.getByLabelText("audio player");
    const initialTimeUpdateHandler = audio.ontimeupdate;
    const initialVolumeChangeHandler = audio.onvolumechange;

    // Same root component as `renderWithContexts` renders, so the store
    // instance survives the rerender.
    rerender(
      <TestProviders>
        <AudioContext.Provider value={contextWithRef}>
          <AudioElement />
        </AudioContext.Provider>
      </TestProviders>,
    );

    expect(audio.ontimeupdate).toBe(initialTimeUpdateHandler);
    expect(audio.onvolumechange).toBe(initialVolumeChangeHandler);
  });

  it("sets the correct src from audioFiles when provided", () => {
    renderWithContexts({
      audioContext: createAudioContext(),
      audioFiles: [{ src: "test-audio.mp3" }],
      component: <AudioElement />,
    });
    const audio = screen.getByLabelText("audio player");
    expect(audio).toHaveAttribute("src", "test-audio.mp3");
  });

  it("renders with proper accessibility attributes", () => {
    renderWithContexts({
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
