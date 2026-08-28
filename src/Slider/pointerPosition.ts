import type { Orientation } from "./sliderMath";

/** Anything carrying a pointer position, React-synthetic or native. */
export type PositionEvent =
  | { clientX: number; clientY: number }
  | { touches: ArrayLike<{ clientX: number; clientY: number }> };

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
    const touch = event.touches[0];
    if (!touch) return 0;
    return orientation === "horizontal" ? touch.clientX : touch.clientY;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}
