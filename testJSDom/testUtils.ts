import { vi } from "vitest";
import React from "react";

/**
 * jsdom gives every element a zero-sized rect, so a slider's geometry has to be
 * stubbed. This is the one thing about a slider that a jsdom test cannot observe
 * for real.
 */
export const TRACK = { start: 100, length: 200 };

export function stubRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    left: TRACK.start,
    top: TRACK.start,
    width: TRACK.length,
    height: TRACK.length,
    right: TRACK.start + TRACK.length,
    bottom: TRACK.start + TRACK.length,
    x: TRACK.start,
    y: TRACK.start,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

/**
 * Makes every element in the tree report the stubbed track rect, so a rendered
 * slider has geometry to map pointer positions onto.
 */
export function stubElementRects(rect: DOMRect = stubRect()) {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () => rect;
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

/** jsdom has no `ResizeObserver`, and `useSlider` attaches one. */
export function stubResizeObserver() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

export function createPointerEvent(
  overrides: Partial<React.PointerEvent<HTMLButtonElement>> = {},
): React.PointerEvent<HTMLButtonElement> {
  return {
    clientX: 50,
    clientY: 0,
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        width: 40,
        top: 0,
        height: 20,
      }),
    },
    ...overrides,
  } as React.PointerEvent<HTMLButtonElement>;
}

export const labels = {
  seekForward: "Seek forward by 10 seconds",
  seekBackward: "Seek backward by 10 seconds",
  playAudio: "Play audio",
  pauseAudio: "Pause audio",
  timeline: "Timeline slider",
};

/**
 * jsdom has no `PointerEvent`, and Testing Library's `fireEvent.pointerDown`
 * then drops `clientX` / `clientY`. `MouseEvent` carries them, and both React's
 * root listener and a window listener key off the type string.
 */
export function pointerEventAt(type: string, position: number): MouseEvent {
  return new MouseEvent(type, {
    clientX: position,
    clientY: position,
    bubbles: true,
  });
}

/** A position a fraction of the way along the stubbed track. */
export function alongTrack(fraction: number): number {
  return TRACK.start + TRACK.length * fraction;
}
