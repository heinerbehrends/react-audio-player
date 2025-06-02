import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimeDisplay } from "../../src/TimeDisplay/useTimeDisplay";
import {
  AudioContext,
  type AudioContextType,
} from "../../src/AudioElement/AudioContext";
import { createAudioContext } from "../testUtils";

describe("useTimeDisplay", () => {
  const createWrapper =
    (contextValue: AudioContextType) =>
    ({ children }: { children: React.ReactNode }) => (
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
      context.audioElementRef.current!.addEventListener,
    ).toHaveBeenCalledWith("timeupdate", expect.any(Function));
  });

  it("cleans up event listener on unmount", () => {
    const context = createAudioContext();
    const { unmount } = renderHook(() => useTimeDisplay(), {
      wrapper: createWrapper(context),
    });

    unmount();

    expect(
      context.audioElementRef.current!.removeEventListener,
    ).toHaveBeenCalledWith("timeupdate", expect.any(Function));
  });
});
