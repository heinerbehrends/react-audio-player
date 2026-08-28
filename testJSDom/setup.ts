import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

try {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
  }
} catch {
  globalThis.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi
    .fn()
    .mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();

  Object.defineProperties(window.HTMLMediaElement.prototype, {
    currentTime: {
      get() {
        return this._currentTime || 0;
      },
      set(time) {
        this._currentTime = time;
      },
    },
    duration: {
      get() {
        return this._duration || 100;
      },
      set(time) {
        this._duration = time;
      },
    },
    paused: {
      get() {
        return this._paused !== false;
      },
      set(value) {
        this._paused = value;
      },
    },
    muted: {
      get() {
        return this._muted || false;
      },
      set(value) {
        this._muted = value;
      },
    },
    volume: {
      get() {
        return this._volume === undefined ? 1 : this._volume;
      },
      set(value) {
        this._volume = value;
      },
    },
    playbackRate: {
      get() {
        return this._playbackRate || 1;
      },
      set(value) {
        this._playbackRate = value;
      },
    },
  });
});
