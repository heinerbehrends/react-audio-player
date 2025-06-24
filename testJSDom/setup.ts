import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock ResizeObserver immediately to prevent any timing issues
try {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
  }
} catch {
  // Fallback mock if the above fails
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock HTMLMediaElement API which is not implemented in JSDOM
beforeAll(() => {
  // Mock play/pause methods
  window.HTMLMediaElement.prototype.play = vi
    .fn()
    .mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();

  // Mock media properties
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
