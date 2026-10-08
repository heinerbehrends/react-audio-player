import { describe, it, expect, vi } from "vitest";
import {
  handleMediaKeys,
  type Shortcuts,
  useHandleMediaKeys,
} from "../../src/KeyboardControls/handleMediaKeys";
import { renderHook } from "@testing-library/react";
import React from "react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { createTestStore } from "../store/createTestStore";
import type { MediaFields } from "../store/mediaElementFake";

type KeyInit = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

function keyEvent(key: string, init: KeyInit = {}) {
  return {
    key,
    ...init,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLButtonElement>;
}

/**
 * The handler against a loaded store, asserting on the attached element rather
 * than on what the shortcut was handed.
 */
function setup(element: Partial<MediaFields> = {}, shortcuts?: Shortcuts) {
  const harness = createTestStore({ readyState: 1, ...element });
  const press = (key: string, init?: KeyInit) => {
    const event = keyEvent(key, init);
    const handled = handleMediaKeys({
      event,
      player: () => harness.store.read(),
      shortcuts,
    });
    return { handled, event };
  };
  return { press, ...harness };
}

function renderMediaKeys(element: Partial<MediaFields> = {}) {
  const harness = createTestStore({ readyState: 1, ...element });
  const { result } = renderHook(() => useHandleMediaKeys(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        <PlayerConfigProvider
          track={{ src: "test-audio.mp3" }}
          shortcuts={undefined}
          labels={undefined}
        >
          {children}
        </PlayerConfigProvider>
      </PlayerStoreProvider>
    ),
  });
  return { handle: result.current, ...harness };
}

describe("handleMediaKeys", () => {
  describe("Playback control keys", () => {
    it.each(["p", "k", "MediaPlayPause"])("%s plays and pauses", (key) => {
      const { press, element } = setup({ paused: true });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.play).toHaveBeenCalledTimes(1);

      element.paused = false;
      element.emit("play");
      press(key);
      expect(element.pause).toHaveBeenCalledTimes(1);
    });

    it.each(["s", "MediaStop"])("%s stops", (key) => {
      const { press, element } = setup({ paused: false, currentTime: 40 });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.pause).toHaveBeenCalled();
      expect(element.currentTime).toBe(0);
    });
  });

  describe("Volume control keys", () => {
    it.each(["m", "MediaMute"])("%s toggles mute", (key) => {
      const { press, element } = setup();

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.muted).toBe(true);

      press(key);
      expect(element.muted).toBe(false);
    });

    it.each(["ArrowUp", "MediaVolumeUp"])("%s raises the volume", (key) => {
      const { press, element } = setup({ volume: 0.5 });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.volume).toBeCloseTo(0.525);
    });

    it.each(["ArrowDown", "MediaVolumeDown"])("%s lowers the volume", (key) => {
      const { press, element } = setup({ volume: 0.5 });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.volume).toBeCloseTo(0.475);
    });

    it("mutes when ArrowDown reaches zero", () => {
      const { press, element } = setup({ volume: 0.025 });

      press("ArrowDown");

      expect(element.muted).toBe(true);
    });
  });

  describe("Seeking keys", () => {
    it.each([
      { key: "ArrowRight", expected: 15 },
      { key: "l", expected: 20 },
      { key: "ArrowLeft", expected: 5 },
      { key: "j", expected: 0 },
    ])("$key seeks from 10 to $expected", ({ key, expected }) => {
      const { press, element } = setup({ currentTime: 10 });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.currentTime).toBe(expected);
    });
  });

  describe("Numeric seek keys", () => {
    it.each([
      { key: "0", expected: 0 },
      { key: "1", expected: 20 },
      { key: "5", expected: 100 },
      { key: "9", expected: 180 },
    ])("$key seeks to $expected of 200", ({ key, expected }) => {
      const { press, element } = setup({ duration: 200, currentTime: 50 });

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.currentTime).toBe(expected);
    });
  });

  describe("Playback rate keys", () => {
    it.each([">", "]"])("%s steps the rate up", (key) => {
      const { press, element } = setup();

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.playbackRate).toBeCloseTo(1.05);
    });

    it.each(["<", "["])("%s steps the rate down", (key) => {
      const { press, element } = setup();

      const { handled, event } = press(key);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.playbackRate).toBeCloseTo(0.95);
    });

    it("Backspace resets the rate", () => {
      const { press, element } = setup({ playbackRate: 2 });

      const { handled, event } = press("Backspace");

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.playbackRate).toBe(1);
    });
  });

  describe("Modifier keys", () => {
    it.each(["ctrlKey", "metaKey", "altKey"] as const)(
      "leaves %s combinations to the browser",
      (modifier) => {
        const { press, element } = setup({ paused: true });

        const { handled, event } = press("p", { [modifier]: true });

        expect(handled).toBe(false);
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(element.play).not.toHaveBeenCalled();
      },
    );

    // `<` and `>` are shifted keys.
    it("does not block Shift", () => {
      const { press, element } = setup();

      const { handled } = press(">", { shiftKey: true });

      expect(handled).toBe(true);
      expect(element.playbackRate).toBeCloseTo(1.05);
    });
  });

  describe("Letter case", () => {
    it.each(["P", "K"])("%s plays, as Shift or Caps Lock sends it", (key) => {
      const { press, element } = setup({ paused: true });

      const { handled } = press(key, { shiftKey: true });

      expect(handled).toBe(true);
      expect(element.play).toHaveBeenCalledTimes(1);
    });

    it("S stops", () => {
      const { press, element } = setup({ paused: false });

      press("S");

      expect(element.pause).toHaveBeenCalled();
    });

    it("M mutes", () => {
      const { press, element } = setup();

      press("M");

      expect(element.muted).toBe(true);
    });

    it.each([
      { key: "L", expected: 20 },
      { key: "J", expected: 0 },
    ])("$key seeks like its lowercase default", ({ key, expected }) => {
      const { press, element } = setup({ currentTime: 10 });

      press(key);

      expect(element.currentTime).toBe(expected);
    });

    it("unbinds both cases with a lowercase null", () => {
      const { press, element } = setup({ paused: true }, { p: null });

      const { handled, event } = press("P");

      expect(handled).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(element.play).not.toHaveBeenCalled();
    });

    it("applies an uppercase binding to the lowercase key", () => {
      const { press, element } = setup(
        { currentTime: 10 },
        { L: ({ seekBy }) => seekBy(30) },
      );

      press("l");

      expect(element.currentTime).toBe(40);
    });
  });

  describe("Custom keyboard shortcuts", () => {
    it("merges over the defaults", () => {
      const { press, element } = setup(
        { paused: true },
        { x: ({ toggleMute }) => toggleMute() },
      );

      expect(press("x").handled).toBe(true);
      expect(element.muted).toBe(true);

      expect(press("p").handled).toBe(true);
      expect(element.play).toHaveBeenCalledTimes(1);
    });

    it("replaces a default", () => {
      const { press, element } = setup(
        { paused: true },
        { p: ({ toggleMute }) => toggleMute() },
      );

      press("p");

      expect(element.play).not.toHaveBeenCalled();
      expect(element.muted).toBe(true);
    });

    /**
     * The escape hatch S24 owes the consumer: composing `onKeyDown` means a
     * spread handler no longer replaces the library's, so `null` is the only
     * way left to turn a shortcut off.
     */
    it("unbinds a default and lets the key through", () => {
      const { press, element } = setup({ paused: true }, { p: null });

      const { handled, event } = press("p");

      expect(handled).toBe(false);
      expect(element.play).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("unbinds one key without disturbing its neighbours", () => {
      const { press, element } = setup({ paused: true }, { p: null });

      expect(press("k").handled).toBe(true);
      expect(element.play).toHaveBeenCalledTimes(1);
    });

    it("hands the shortcut the player's state", () => {
      const { press, element } = setup(
        { duration: 200 },
        { x: ({ seek, duration }) => seek(duration / 2) },
      );

      const { handled, event } = press("x");

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(element.currentTime).toBe(100);
    });

    it("reads the player when the key is pressed, and only then", () => {
      const harness = createTestStore({ readyState: 1 });
      const player = vi.fn(() => harness.store.read());

      handleMediaKeys({ event: keyEvent("a"), player, shortcuts: undefined });
      expect(player).not.toHaveBeenCalled();

      handleMediaKeys({ event: keyEvent("m"), player, shortcuts: undefined });
      expect(player).toHaveBeenCalledTimes(1);
    });

    it("handles multiple custom shortcuts", () => {
      const { press, element } = setup(
        { paused: true, currentTime: 10 },
        {
          x: ({ toggle }) => toggle(),
          y: ({ toggleMute }) => toggleMute(),
          z: ({ seekBy }) => seekBy(30),
        },
      );

      press("x");
      press("y");
      press("z");

      expect(element.play).toHaveBeenCalledTimes(1);
      expect(element.muted).toBe(true);
      expect(element.currentTime).toBe(40);
    });
  });

  // A1: Space presses the focused button; `<PlayerRoot>` binds it itself.
  it("leaves Space unbound", () => {
    const { press, element } = setup({ paused: true });

    const { handled, event } = press(" ");

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(element.play).not.toHaveBeenCalled();
  });

  it("returns false for unhandled keys", () => {
    const { press, element } = setup({ paused: true });

    const { handled, event } = press("a");

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(element.play).not.toHaveBeenCalled();
  });
});

describe("useHandleMediaKeys", () => {
  it("should handle key events correctly", () => {
    const { handle, element } = renderMediaKeys({ paused: true });
    const event = keyEvent("p");

    const handled = handle(event);

    expect(handled).toBe(true);
    expect(element.play).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("should not stop propagation for unhandled keys", () => {
    const { handle, element } = renderMediaKeys({ paused: true });
    const event = keyEvent("x");

    const handled = handle(event);

    expect(handled).toBe(false);
    expect(element.play).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});

/**
 * S15, carried over to functions. A type, so the assertions are compile-time:
 * `@ts-expect-error` fails the build if the error stops happening.
 */
describe("what a key can be bound to", () => {
  it("accepts a function of the player, or null", () => {
    const map: Shortcuts = {
      a: ({ toggle }) => toggle(),
      b: ({ seek, duration }) => seek(duration / 2),
      c: ({ adjustRate }) => adjustRate(0.1),
      // `null` unbinds — see `Shortcuts`.
      d: null,
    };

    expect(Object.keys(map)).toHaveLength(4);
  });

  it("rejects the old action objects", () => {
    const map: Shortcuts = {
      // @ts-expect-error an action, not a function
      a: { type: "TOGGLE_PLAY" },
    };

    expect(Object.keys(map)).toHaveLength(1);
  });
});
