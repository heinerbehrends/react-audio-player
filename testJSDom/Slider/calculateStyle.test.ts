import { describe, it, expect } from "vitest";
import {
  calculateDragStyle,
  calculateProgressStyle,
  progressStyles,
  containerStyles,
  buttonStyles,
  type StyleContext,
} from "../../src/Slider/calculateStyle";

describe("calculateStyle", () => {
  const defaultContext: StyleContext = {
    mode: "seek",
    value: 0.5,
    minValue: 0,
    maxValue: 1,
    sliderLength: 100,
    orientation: "horizontal",
  };
  describe("calculateDragStyle", () => {
    it("calculates horizontal drag style correctly", () => {
      const style = calculateDragStyle(defaultContext);

      expect(style).toEqual({
        position: "absolute",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        cursor: "grab",
        transform: "translate(calc(50px - 20px), 0)",
        touchAction: "none",
      });
    });

    it("calculates vertical drag style correctly", () => {
      const context = {
        ...defaultContext,
        orientation: "vertical" as const,
      };
      const style = calculateDragStyle(context);

      expect(style).toEqual({
        position: "absolute",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        cursor: "grab",
        transform: "translate(0, calc(50px - 20px))",
        touchAction: "none",
      });
    });

    // The old context carried a `clientXY` the styles never read —
    // `calculateDragStyle` positions the thumb from `value` through `getOffset`.
    // `StyleContext` is now exactly what the styles use.
    it("positions from the value alone", () => {
      const style = calculateDragStyle({ ...defaultContext, value: 0.75 });

      expect(style.transform).toBe("translate(calc(75px - 20px), 0)");
    });
  });

  describe("calculateProgressStyle", () => {
    it("calculates horizontal progress style correctly", () => {
      const style = calculateProgressStyle(defaultContext);

      expect(style).toEqual({
        transform: "scaleX(0.5)",
        transformOrigin: "left",
      });
    });

    it("calculates vertical progress style correctly", () => {
      const context = {
        ...defaultContext,
        orientation: "vertical" as const,
      };
      const style = calculateProgressStyle(context);

      expect(style).toEqual({
        transform: "scaleY(0.5)",
        transformOrigin: "bottom",
      });
    });

    it("handles vertical volume component", () => {
      const context = {
        ...defaultContext,
        orientation: "vertical" as const,
        mode: "volume" as const,
        value: 0.5,
      };
      const style = calculateProgressStyle(context);

      expect(style).toEqual({
        transform: "scaleY(0.5)",
        transformOrigin: "bottom",
      });
    });

    /**
     * The three vertical cases above all sit at `value: 0.5`, which is the fixed
     * point of `x → 1 - x`, so inverted and non-inverted agree exactly there and
     * none of them pins the inversion. These four do.
     *
     * `getOffset` already inverts for vertical, and `getProgress` undoes it again
     * for vertical volume — a double negative that happens to cancel. Phase 3
     * derives the inversion from `orientation` alone; without these assertions
     * that change would flip vertical volume with the suite still green.
     */
    it.each([
      [0.25, "scaleY(0.25)"],
      [0.8, "scaleY(0.8)"],
    ])("tracks the value for vertical volume at %f", (value, expected) => {
      const style = calculateProgressStyle({
        ...defaultContext,
        orientation: "vertical" as const,
        mode: "volume" as const,
        value,
      });

      expect(style.transform).toBe(expected);
    });

    it.each([
      [0.25, "scaleY(0.75)"],
      [0.8, "scaleY(0.2)"],
    ])(
      "inverts the value for a vertical non-volume slider at %f",
      (value, expected) => {
        const style = calculateProgressStyle({
          ...defaultContext,
          orientation: "vertical" as const,
          mode: "seek" as const,
          value,
        });

        expect(style.transform).toBe(expected);
      },
    );

    it("handles edge cases", () => {
      const context = {
        ...defaultContext,
        value: 0,
        sliderLength: 0,
      };
      const style = calculateProgressStyle(context);

      expect(style).toEqual({
        transform: "scaleX(0)",
        transformOrigin: "left",
      });
    });
  });

  describe("constant styles", () => {
    it("has correct progress styles", () => {
      expect(progressStyles).toEqual({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
      });
    });

    it("has correct container styles", () => {
      expect(containerStyles).toEqual({
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        width: "100%",
        height: "100%",
        position: "relative",
      });
    });

    it("has correct button styles", () => {
      expect(buttonStyles).toEqual({
        border: "none",
        background: "none",
        padding: 0,
      });
    });
  });
});
