import { describe, it, expect } from "vitest";
import {
  backgroundStyles,
  calculateDragStyle,
  calculateProgressStyle,
  progressStyles,
  containerStyles,
  rootStyles,
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
        transform: "translate(calc(50px - 50%), 0)",
        touchAction: "none",
        zIndex: 2,
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
        transform: "translate(0, calc(50px - 50%))",
        touchAction: "none",
        zIndex: 2,
      });
    });

    // `calculateDragStyle` positions the thumb from `value` through
    // `getOffset`, so `StyleContext` carries no pointer position.
    it("positions from the value alone", () => {
      const style = calculateDragStyle({ ...defaultContext, value: 0.75 });

      expect(style.transform).toBe("translate(calc(75px - 50%), 0)");
    });
  });

  describe("calculateProgressStyle", () => {
    it("calculates horizontal progress style correctly", () => {
      const style = calculateProgressStyle(defaultContext);

      expect(style).toEqual({
        transform: "scaleX(0.5)",
        transformOrigin: "left",
        zIndex: 1,
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
        zIndex: 1,
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
        zIndex: 1,
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
        height: "100%",
        position: "relative",
      });
    });

    /**
     * S8. These live in `styles.css` so a consumer's class can beat them. Put
     * any of them back inline and the stylesheet is silently outranked again,
     * which is the regression this pins.
     */
    it.each(["border", "background", "padding", "cursor", "width"])(
      "keeps %s out of the root's inline styles",
      (property) => {
        expect(rootStyles).not.toHaveProperty(property);
      },
    );

    it("keeps cursor out of the thumb's inline styles", () => {
      expect(
        calculateDragStyle({ ...defaultContext, value: 0.5 }),
      ).not.toHaveProperty("cursor");
    });
  });
});

/**
 * F12, one layer up: an invalid `translate()` makes the browser discard the
 * whole transform, so the thumb does not move at all.
 */
describe("a zero range", () => {
  it("emits a usable transform rather than NaN", () => {
    const style = calculateDragStyle({
      value: 0,
      minValue: 0,
      maxValue: 0,
      sliderLength: 200,
      orientation: "horizontal",
    });

    expect(style.transform).not.toContain("NaN");
    expect(style.transform).toBe("translate(calc(0px - 50%), 0)");
  });
});

/**
 * S22. The fill used to sit above the background only because its `transform`
 * makes a stacking context. A consumer overriding `transform` — which the
 * custom-properties work invites — swapped the two with nothing to point at.
 */
describe("the layer stack", () => {
  const context: StyleContext = {
    value: 0.5,
    minValue: 0,
    maxValue: 1,
    sliderLength: 100,
    orientation: "horizontal",
  };

  it("orders background, fill and thumb", () => {
    expect(backgroundStyles.zIndex).toBe(0);
    expect(calculateProgressStyle(context).zIndex).toBe(1);
    expect(calculateDragStyle(context).zIndex).toBe(2);
  });

  it("holds the order when the fill's transform is overridden", () => {
    const fill = { ...calculateProgressStyle(context), transform: "none" };

    expect(Number(fill.zIndex)).toBeGreaterThan(
      Number(backgroundStyles.zIndex),
    );
  });

  it("leaves the background a full-size grid layer", () => {
    expect(backgroundStyles).toEqual({ ...progressStyles, zIndex: 0 });
  });
});

/**
 * C10. `getProgress` used to take `sliderLength` and never use it in the
 * arithmetic — it was a proxy for "not measured yet". The guard is now its own
 * step, so the two questions cannot be confused again.
 */
describe("an unmeasured track", () => {
  const context: StyleContext = {
    value: 30,
    minValue: 0,
    maxValue: 100,
    sliderLength: 0,
    orientation: "horizontal",
  };

  it("draws no fill before the track has been measured", () => {
    expect(calculateProgressStyle(context).transform).toBe("scaleX(0)");
  });

  it("draws the same fraction at every length once it has", () => {
    expect(
      calculateProgressStyle({ ...context, sliderLength: 1 }).transform,
    ).toBe("scaleX(0.3)");
    expect(
      calculateProgressStyle({ ...context, sliderLength: 1000 }).transform,
    ).toBe("scaleX(0.3)");
  });
});
