import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimeDisplay } from "../../src/TimeDisplay/useTimeDisplay";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import React from "react";

describe("useTimeDisplay", () => {
  const createAudioContext = (overrides = {}) => ({
    audioElementRef: {
      current: {
        currentTime: 45,
        duration: 120,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        paused: false,
        ...overrides,
      },
    },
  });

  const createWrapper =
    (contextValue) =>
    ({ children }) =>
      (
        <AudioContext.Provider value={contextValue}>
          {children}
        </AudioContext.Provider>
      );

  it("sets up timeupdate event listener", () => {
    const context = createAudioContext();
    renderHook(() => useTimeDisplay(), {
      wrapper: createWrapper(context),
    });

    expect(
      context.audioElementRef.current.addEventListener
    ).toHaveBeenCalledWith("timeupdate", expect.any(Function));
  });

  it("cleans up event listener on unmount", () => {
    const context = createAudioContext();
    const { unmount } = renderHook(() => useTimeDisplay(), {
      wrapper: createWrapper(context),
    });

    unmount();

    expect(
      context.audioElementRef.current.removeEventListener
    ).toHaveBeenCalledWith("timeupdate", expect.any(Function));
  });
});
