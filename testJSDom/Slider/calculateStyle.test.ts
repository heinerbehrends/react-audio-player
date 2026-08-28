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

    // `calculateDragStyle` positions the thumb from `value` through
    // `getOffset`, so `StyleContext` carries no pointer position.
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

    it("fills a vertical slider from its value, whatever the slider is", () => {
      const context = {
        ...defaultContext,
        orientation: "vertical" as const,
        value: 0.5,
      };
      const style = calculateProgressStyle(context);

      expect(style).toEqual({
        transform: "scaleY(0.5)",
        transformOrigin: "bottom",
      });
    });

    /**
     * The vertical cases above all sit at `value: 0.5`, the fixed point of
     * `x -> 1 - x`, where an inverted and a non-inverted rule agree exactly. The
     * rows below sit away from it, so they are the ones that pin the direction.
     */
    it.each([
      [0.25, "scaleY(0.25)"],
      [0.8, "scaleY(0.8)"],
    ])("tracks the value for a vertical slider at %f", (value, expected) => {
      const style = calculateProgressStyle({
        ...defaultContext,
        orientation: "vertical" as const,
        value,
      });

      expect(style.transform).toBe(expected);
    });

    it.each([
      [0.25, "scaleX(0.25)"],
      [0.8, "scaleX(0.8)"],
    ])("tracks the value for a horizontal slider at %f", (value, expected) => {
      const style = calculateProgressStyle({ ...defaultContext, value });

      expect(style.transform).toBe(expected);
    });

    it("maps the value through its own range, not through 0 to 1", () => {
      const style = calculateProgressStyle({
        ...defaultContext,
        minValue: 0.5,
        maxValue: 2.5,
        value: 1.5,
      });

      expect(style.transform).toBe("scaleX(0.5)");
    });

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
