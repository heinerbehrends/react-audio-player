import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
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
const hooks: { name: string; use: () => ButtonBagBase }[] = [
  { name: "usePlayButtonProps", use: () => usePlayButtonProps() },
  { name: "useMuteButtonProps", use: () => useMuteButtonProps() },
  { name: "useSeekButtonProps", use: () => useSeekButtonProps(10) },
  { name: "useTimeToggleProps", use: () => useTimeToggleProps() },
  { name: "usePlaybackRateSetProps", use: () => usePlaybackRateSetProps(1.5) },
  {
    name: "usePlaybackRateChangeProps",
    use: () => usePlaybackRateChangeProps(0.25),
  },
];

describe.each(hooks)("$name", ({ use }) => {
  it("returns a complete bag when called with no props", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const { result } = renderHook(use, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <PlayerStoreProvider store={harness.store}>
          <PlayerConfigProvider
            audioFile={{ src: "test-audio.mp3" }}
            customKeyboardShortcuts={undefined}
          >
            {children}
          </PlayerConfigProvider>
        </PlayerStoreProvider>
      ),
    });

    expect(result.current.type).toBe("button");
    expect(result.current["aria-label"]).toBeTruthy();
    expect(typeof result.current.onClick).toBe("function");
    expect(typeof result.current.onKeyDown).toBe("function");
  });
});
