import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useComposedButtonProps } from "../../src/Shared/useComposedButtonProps";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { createTestStore } from "../store/createTestStore";
import type { MediaFields } from "../store/mediaElementFake";

/**
 * S24. The merge rule, tested where it lives — one hook, no components. That
 * each of the six buttons actually calls it and spreads it last is the separate
 * failure mode, covered in `buttonHandlers.test.tsx`.
 */
function renderComposed(
  ours: React.MouseEventHandler<HTMLButtonElement>,
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
  element: Partial<MediaFields> = {},
) {
  const harness = createTestStore({ readyState: 1, duration: 100, ...element });
  const { result } = renderHook(() => useComposedButtonProps(ours, props), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        <PlayerConfigProvider
          audioFile={{ src: "test-audio.mp3" }}
          customKeyboardShortcuts={undefined}
          labels={undefined}
        >
          {children}
        </PlayerConfigProvider>
      </PlayerStoreProvider>
    ),
  });
  return { composed: result.current, ...harness };
}

/** `defaultPrevented` has to follow `preventDefault()`: it is the opt-out. */
function fakeEvent(key?: string) {
  let defaultPrevented = false;
  return {
    key,
    get defaultPrevented() {
      return defaultPrevented;
    },
    preventDefault: () => {
      defaultPrevented = true;
    },
    stopPropagation: vi.fn(),
  };
}

function mouseEvent() {
  return fakeEvent() as unknown as React.MouseEvent<HTMLButtonElement>;
}

function keyEvent(key: string) {
  return fakeEvent(key) as unknown as React.KeyboardEvent<HTMLButtonElement>;
}

describe("useComposedButtonProps", () => {
  it("runs the consumer's onClick alongside the library's", () => {
    const ours = vi.fn();
    const theirs = vi.fn();
    const { composed } = renderComposed(ours, { onClick: theirs });

    composed.onClick?.(mouseEvent());

    expect(theirs).toHaveBeenCalled();
    expect(ours).toHaveBeenCalled();
  });

  it("lets the consumer opt out of ours with preventDefault()", () => {
    const ours = vi.fn();
    const theirs = vi.fn((event: React.MouseEvent<HTMLButtonElement>) =>
      event.preventDefault(),
    );
    const { composed } = renderComposed(ours, { onClick: theirs });

    composed.onClick?.(mouseEvent());

    expect(theirs).toHaveBeenCalled();
    expect(ours).not.toHaveBeenCalled();
  });

  it("runs the consumer's onKeyDown alongside the media keys", () => {
    const theirs = vi.fn();
    const { composed, element } = renderComposed(vi.fn(), {
      onKeyDown: theirs,
    });

    composed.onKeyDown(keyEvent("p"));

    expect(theirs).toHaveBeenCalled();
    expect(element.play).toHaveBeenCalled();
  });

  /**
   * The gate covers activation, not the shortcuts. `p` is player-wide, so
   * gating it on one button's disabled state would mean it working from five
   * buttons and not from the sixth. Pinned so nobody "fixes" it.
   */
  it("drops both onClick handlers while aria-disabled, and neither onKeyDown", () => {
    const ours = vi.fn();
    const theirs = vi.fn();
    const theirKeys = vi.fn();
    const { composed, element } = renderComposed(
      ours,
      { onClick: theirs, onKeyDown: theirKeys },
      // `isUnusable` is an error *and* `readyState: 0` — see `syncFromElement`.
      { readyState: 0, error: {} as MediaError },
    );

    expect(composed["aria-disabled"]).toBe(true);
    expect(composed.onClick).toBeUndefined();

    composed.onKeyDown(keyEvent("p"));

    expect(theirKeys).toHaveBeenCalled();
    expect(element.play).toHaveBeenCalled();
    expect(theirs).not.toHaveBeenCalled();
    expect(ours).not.toHaveBeenCalled();
  });
});
