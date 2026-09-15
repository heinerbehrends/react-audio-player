import type { Orientation } from "./sliderMath";

type Point = { clientX: number; clientY: number };

/** Anything carrying a pointer position, React-synthetic or native. */
export type PositionEvent =
  Point | { touches: ArrayLike<Point>; changedTouches?: ArrayLike<Point> };

/**
 * The coordinate a slider cares about, from whichever shape the event has.
 *
 * Its own module because it is the one DOM-coupled helper in the slider's stack;
 * everything else there is arithmetic over numbers.
 */
export function positionOf(
  event: PositionEvent,
  orientation: Orientation,
): number {
  if ("touches" in event) {
    // A lifted finger is only in `changedTouches`, so `touchend` used to read
    // as position 0 (C11).
    const touch = event.touches[0] ?? event.changedTouches?.[0];
    if (!touch) return 0;
    return orientation === "horizontal" ? touch.clientX : touch.clientY;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}
