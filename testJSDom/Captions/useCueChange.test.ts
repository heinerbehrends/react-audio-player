import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCueChange } from "../../src/Captions/captionsHooks";

// Mock the AudioContext
vi.mock("../../src/AudioElement/AudioContext", () => ({
  useAudioContext: vi.fn(),
}));

describe("useCueChange", () => {
  const mockHandleCueChange = vi.fn();
  let trackRef: { current: HTMLTrackElement | null };
  let mockTrackElement: HTMLTrackElement;
  let mockTextTrack: TextTrack;
  let mockCaptionsCallbackRef: {
    current: { handleCueChange: typeof mockHandleCueChange | null };
  };

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a mock TextTrack
    mockTextTrack = {
      mode: "hidden",
      activeCues: [] as unknown as TextTrackCueList,
    } as TextTrack;

    // Create a mock track element
    mockTrackElement = document.createElement("track") as HTMLTrackElement;
    Object.defineProperty(mockTrackElement, "track", {
      value: mockTextTrack,
      writable: true,
    });

    // Add event listener management to the mock element
    mockTrackElement.addEventListener = vi.fn();
    mockTrackElement.removeEventListener = vi.fn();

    // Set up the ref
    trackRef = { current: mockTrackElement };

    // Mock the AudioContext
    mockCaptionsCallbackRef = {
      current: { handleCueChange: mockHandleCueChange },
    };
    const { useAudioContext } = await import(
      "../../src/AudioElement/AudioContext"
    );
    vi.mocked(useAudioContext).mockReturnValue({
      captionsCallbackRef: mockCaptionsCallbackRef,
      audioElementRef: { current: null },
      timelineCallbackRef: { current: { handleTimelineAction: null } },
      volumeCallbackRef: { current: { handleVolumeAction: null } },
      playbackRateCallbackRef: { current: { handlePlaybackRateAction: null } },
    });
  });

  it("should add cuechange event listener on mount", () => {
    renderHook(() => useCueChange({ trackRef }));

    expect(mockTrackElement.addEventListener).toHaveBeenCalledWith(
      "cuechange",
      expect.any(Function),
    );
  });

  it("should remove cuechange event listener on unmount", () => {
    const { unmount } = renderHook(() => useCueChange({ trackRef }));

    unmount();

    expect(mockTrackElement.removeEventListener).toHaveBeenCalledWith(
      "cuechange",
      expect.any(Function),
    );
  });
});
