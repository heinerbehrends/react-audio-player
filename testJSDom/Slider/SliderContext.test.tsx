import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  SliderProvider,
  useSliderContext,
} from "../../src/Slider/SliderContext";
import {
  PlayerConfigProvider,
  usePlayerConfig,
} from "../../src/Player/PlayerConfigContext";
import type { SliderValue } from "../../src/Slider/useSlider";

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Both contexts default to `null` so that the missing-provider guard can fire at
 * all — a real default would let a subcomponent render against dead state
 * instead. These rows are what keeps the default from being "helpfully" filled
 * in later; `PlayerStoreContext.test.tsx` holds the third one.
 *
 * S14 is the other half of this story and is still open: a *mis-nested* child
 * still fails silently, because it does reach a provider.
 */
describe("useSliderContext", () => {
  it("throws outside a slider root, rather than handing back a dead default", () => {
    // React logs the boundary-less throw; the assertion is the throw.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useSliderContext())).toThrow(
      /must be used inside their slider root/,
    );
  });

  it("names the three roots a consumer could have meant", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useSliderContext())).toThrow(
      /<Timeline>, <Volume> or <PlaybackRateSlider>/,
    );
  });

  it("returns the published slider inside a root", () => {
    const value = { value: 0.5, dragState: "idle" } as SliderValue;

    const { result } = renderHook(() => useSliderContext(), {
      wrapper: ({ children }) => (
        <SliderProvider value={value}>{children}</SliderProvider>
      ),
    });

    expect(result.current).toBe(value);
  });
});

describe("usePlayerConfig", () => {
  it("throws without a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => usePlayerConfig())).toThrow(
      /must be used within a PlayerConfigProvider/,
    );
  });

  it("returns the config inside a provider", () => {
    const { result } = renderHook(() => usePlayerConfig(), {
      wrapper: ({ children }) => (
        <PlayerConfigProvider
          audioFile={{ src: "test-audio.mp3" }}
          customKeyboardShortcuts={{ x: { type: "TOGGLE_PLAY" } }}
        >
          {children}
        </PlayerConfigProvider>
      ),
    });

    expect(result.current.audioFile).toEqual({ src: "test-audio.mp3" });
    expect(result.current.customKeyboardShortcuts).toEqual({
      x: { type: "TOGGLE_PLAY" },
    });
  });
});
