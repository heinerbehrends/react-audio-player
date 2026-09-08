import { describe, it, expect } from "vitest";
import { positionOf } from "../../src/Slider/pointerPosition";
import type { PositionEvent } from "../../src/Slider/pointerPosition";

/**
 * C7. This was `getClientXY`, a character-for-character copy of
 * `positionOf` with no consumer left in `src/` — so the tests outlived the
 * function they justified. Repointed rather than deleted: axis selection is
 * only unit-testable here, since the jsdom slider fixtures set
 * `clientX === clientY`.
 */
describe("positionOf", () => {
  it("handles mouse events", () => {
    const mouseEvent = {
      clientX: 100,
      clientY: 200,
    } as unknown as PositionEvent;

    expect(positionOf(mouseEvent, "horizontal")).toBe(100);
    expect(positionOf(mouseEvent, "vertical")).toBe(200);
  });

  it("handles touch events", () => {
    const touchEvent = {
      touches: [{ clientX: 100, clientY: 200 }],
    } as unknown as PositionEvent;

    expect(positionOf(touchEvent, "horizontal")).toBe(100);
    expect(positionOf(touchEvent, "vertical")).toBe(200);
  });

  it("handles touch events with no touches", () => {
    const touchEvent = {
      touches: [],
    } as unknown as PositionEvent;

    expect(positionOf(touchEvent, "horizontal")).toBe(0);
    expect(positionOf(touchEvent, "vertical")).toBe(0);
  });
});
