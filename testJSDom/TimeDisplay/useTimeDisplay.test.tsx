import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTimeDisplay } from "../../src/TimeDisplay/useTimeDisplay";
import {
  AudioContext,
  type AudioContextType,
} from "../../src/AudioElement/AudioContext";
import { createAudioContext } from "../testUtils";
import { createMediaElementFake } from "../store/mediaElementFake";

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

  /**
   * `duration ?? 0 - currentTime` parses as `duration ?? (0 - currentTime)`, so
   * `remaining` was the whole track length, constant, and `<Time.Remaining>`
   * rendered the negated duration and never counted down.
   */
  it("counts remaining down as the elapsed time grows", () => {
    const element = createMediaElementFake({ duration: 100, currentTime: 30 });
    const context = createAudioContext({
      audioElementRef: { current: element as unknown as HTMLAudioElement },
    });

    const { result } = renderHook(() => useTimeDisplay(), {
      wrapper: createWrapper(context),
    });

    expect(result.current).toEqual({ elapsed: 30, remaining: 70 });

    act(() => {
      element.currentTime = 45;
      element.emit("timeupdate");
    });

    expect(result.current).toEqual({ elapsed: 45, remaining: 55 });
  });

  it("reports zero remaining at the end of the track", () => {
    const element = createMediaElementFake({ duration: 100, currentTime: 100 });
    const context = createAudioContext({
      audioElementRef: { current: element as unknown as HTMLAudioElement },
    });

    const { result } = renderHook(() => useTimeDisplay(), {
      wrapper: createWrapper(context),
    });

    expect(result.current).toEqual({ elapsed: 100, remaining: 0 });
  });
});
