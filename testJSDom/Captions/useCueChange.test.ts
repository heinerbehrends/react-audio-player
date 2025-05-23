import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCueChange } from "../../src/Captions/captionsHooks";

describe("useCueChange", () => {
  const mockHandlePlayerAction = vi.fn();
  let trackRef: { current: HTMLTrackElement | null };
  let mockTrackElement: HTMLTrackElement;
  let mockTextTrack: TextTrack;

  beforeEach(() => {
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
  });

  it("should add cuechange event listener on mount", () => {
    renderHook(() =>
      useCueChange({
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      })
    );

    expect(mockTrackElement.addEventListener).toHaveBeenCalledWith(
      "cuechange",
      expect.any(Function)
    );
  });

  it("should remove cuechange event listener on unmount", () => {
    const { unmount } = renderHook(() =>
      useCueChange({
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      })
    );

    unmount();

    expect(mockTrackElement.removeEventListener).toHaveBeenCalledWith(
      "cuechange",
      expect.any(Function)
    );
  });

  it("should handle null trackRef", () => {
    trackRef.current = null;

    // This should not throw an error
    renderHook(() =>
      useCueChange({
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      })
    );

    // No listeners should be added since ref is null
    expect(mockTrackElement.addEventListener).not.toHaveBeenCalled();
  });

  it("should dispatch action with cues when cuechange event is triggered", () => {
    renderHook(() =>
      useCueChange({
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      })
    );

    // Get the cuechange handler
    const cueChangeHandler = (mockTrackElement.addEventListener as Mock).mock
      .calls[0][1];

    // Create mock cues
    const mockCue1 = { id: "cue1" } as VTTCue;
    const mockCue2 = { id: "cue2" } as VTTCue;
    const mockActiveCues = [mockCue1, mockCue2] as unknown as TextTrackCueList;

    // Set active cues
    Object.defineProperty(mockTextTrack, "activeCues", {
      value: mockActiveCues,
      writable: true,
    });

    // Create a mock event with currentTarget
    const mockEvent = { currentTarget: mockTrackElement };

    // Call the handler
    cueChangeHandler(mockEvent);

    // Verify the action was dispatched with the cues
    expect(mockHandlePlayerAction).toHaveBeenCalledWith({
      type: "CAPTION_CUE_CHANGE",
      cues: [mockCue1, mockCue2],
    });
  });

  it("should handle null active cues", () => {
    renderHook(() =>
      useCueChange({
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      })
    );

    // Get the cuechange handler
    const cueChangeHandler = (mockTrackElement.addEventListener as Mock).mock
      .calls[0][1];

    // Set active cues to null
    Object.defineProperty(mockTextTrack, "activeCues", {
      value: null as unknown as TextTrackCueList,
      writable: true,
    });

    // Create a mock event with currentTarget
    const mockEvent = { currentTarget: mockTrackElement };

    // Call the handler
    cueChangeHandler(mockEvent);

    // Verify the action was dispatched with empty array
    expect(mockHandlePlayerAction).toHaveBeenCalledWith({
      type: "CAPTION_CUE_CHANGE",
      cues: [],
    });
  });

  it("should not add listener if trackRef changes to null", () => {
    const { rerender } = renderHook((props) => useCueChange(props), {
      initialProps: {
        trackRef,
        handlePlayerAction: mockHandlePlayerAction,
      },
    });

    // Clear mock calls after initial render
    (mockTrackElement.addEventListener as Mock).mockClear();

    // Set trackRef to null and rerender
    trackRef.current = null;
    rerender({
      trackRef,
      handlePlayerAction: mockHandlePlayerAction,
    });

    // No new listener should be added
    expect(mockTrackElement.addEventListener).not.toHaveBeenCalled();
  });
});
