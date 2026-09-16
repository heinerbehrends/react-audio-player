import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { usePlayButtonProps } from "../../src/Player/PlayButton";
import { useMuteButtonProps } from "../../src/Player/MuteButton";
import { useSeekButtonProps } from "../../src/Player/SeekButton";
import { useTimeToggleProps } from "../../src/TimeDisplay/TimeDisplay";
import { usePlaybackRateSetProps } from "../../src/PlaybackRate/SetPlaybackRate";
import { usePlaybackRateChangeProps } from "../../src/PlaybackRate/ChangePlaybackRate";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { createTestStore } from "../store/createTestStore";
import type { ButtonBagBase } from "../../src/Shared/useComposedButtonProps";

/**
 * D1. The components pass their own props through, so no component reaches the
 * no-argument call. Miss the `props ?? {}` default on one hook and that hook
 * throws for a consumer while every other test stays green and the types agree.
 *
 * Composition is not re-tested here: `useComposedButtonProps.test.tsx` owns the
 * merge rule and `buttonHandlers.test.tsx` owns the wiring.
 */
const hooks: { name: string; part: string; use: () => ButtonBagBase }[] = [
  { name: "usePlayButtonProps", part: "play", use: () => usePlayButtonProps() },
  { name: "useMuteButtonProps", part: "mute", use: () => useMuteButtonProps() },
  {
    name: "useSeekButtonProps",
    part: "seek",
    use: () => useSeekButtonProps(10),
  },
  {
    name: "useTimeToggleProps",
    part: "time-toggle",
    use: () => useTimeToggleProps(),
  },
  {
    name: "usePlaybackRateSetProps",
    part: "rate-set",
    use: () => usePlaybackRateSetProps(1.5),
  },
  {
    name: "usePlaybackRateChangeProps",
    part: "rate-change",
    use: () => usePlaybackRateChangeProps(0.25),
  },
];

function wrapper(harness: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PlayerStoreProvider store={harness.store}>
        <PlayerConfigProvider
          audioFile={{ src: "test-audio.mp3" }}
          customKeyboardShortcuts={undefined}
          labels={undefined}
        >
          {children}
        </PlayerConfigProvider>
      </PlayerStoreProvider>
    );
  };
}

describe.each(hooks)("$name", ({ use, part }) => {
  it("returns a complete bag when called with no props", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(use, { wrapper: wrapper(harness) });

    expect(result.current.type).toBe("button");
    expect(result.current["aria-label"]).toBeTruthy();
    expect(result.current["data-part"]).toBe(part);
    expect(typeof result.current.onClick).toBe("function");
    expect(typeof result.current.onKeyDown).toBe("function");
  });
});

/**
 * S9. `data-state` lives in the hook, not in the component's JSX: the six
 * components are one-liners over these hooks, so an attribute written in the JSX
 * would be one `<button {...usePlayButtonProps()}>` did not get.
 *
 * The three hooks left out are the point of the rule — `PlaybackRate.Set`
 * already says it with `aria-pressed`, and the other two have no state.
 */
describe("data-state", () => {
  it("reports the player state on usePlayButtonProps", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(() => usePlayButtonProps(), {
      wrapper: wrapper(harness),
    });

    expect(result.current["data-state"]).toBe("paused");
  });

  it("reports the volume state on useMuteButtonProps", () => {
    const harness = createTestStore({ readyState: 1, muted: true });
    const { result } = renderHook(() => useMuteButtonProps(), {
      wrapper: wrapper(harness),
    });

    expect(result.current["data-state"]).toBe("muted");
  });

  it("reports the readout showing on useTimeToggleProps", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(() => useTimeToggleProps(), {
      wrapper: wrapper(harness),
    });

    expect(result.current["data-state"]).toBe("elapsed");
    act(() =>
      result.current.onClick?.({} as React.MouseEvent<HTMLButtonElement>),
    );
    expect(result.current["data-state"]).toBe("remaining");
  });

  it("is overridable, being in the defaults tier", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(
      () => usePlayButtonProps({ "data-state": "mine" } as never),
      { wrapper: wrapper(harness) },
    );

    expect(result.current["data-state"]).toBe("mine");
  });

  it.each([
    { name: "useSeekButtonProps", use: () => useSeekButtonProps(10) },
    {
      name: "usePlaybackRateSetProps",
      use: () => usePlaybackRateSetProps(1.5),
    },
    {
      name: "usePlaybackRateChangeProps",
      use: () => usePlaybackRateChangeProps(0.25),
    },
  ])("$name writes none", ({ use }) => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(use, { wrapper: wrapper(harness) });

    expect(result.current).not.toHaveProperty("data-state");
  });
});
