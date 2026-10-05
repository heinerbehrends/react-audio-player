import { describe, it, expect } from "vitest";
import {
  backgroundStyles,
  calculateDragStyle,
  fillStyles,
  progressFillRules,
  progressStyles,
  containerStyles,
  rootStyles,
  sliderCustomProperties,
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

  /**
   * S28. The fill's size and transform live in a zero-specificity rule, not
   * inline, so a consumer's stylesheet can replace them.
   */
  describe("the fill", () => {
    it.each(["width", "height", "transform", "transformOrigin"])(
      "keeps %s out of the fill's inline styles",
      (property) => {
        expect(fillStyles).not.toHaveProperty(property);
      },
    );

    it("draws from --progress, horizontally by default", () => {
      expect(progressFillRules).toContain(
        ':where([data-part="progress"][data-orientation]){width:100%;height:100%;transform:scaleX(var(--progress,0));transform-origin:left}',
      );
    });

    it("scales a vertical fill from the bottom", () => {
      expect(progressFillRules).toContain(
        ':where([data-part="progress"][data-orientation="vertical"]){transform:scaleY(var(--progress,0));transform-origin:bottom}',
      );
    });

    // Equal specificity, so source order decides: vertical has to come last.
    it("puts the vertical rule after the default", () => {
      expect(progressFillRules.indexOf("scaleY")).toBeGreaterThan(
        progressFillRules.indexOf("scaleX"),
      );
    });

    it("wraps every selector in :where(), so any rule of yours wins", () => {
      const selectors = progressFillRules.match(/[^{}]+(?={)/g) ?? [];

      expect(selectors).toHaveLength(2);
      for (const selector of selectors) {
        expect(selector).toMatch(/^:where(.*)$/);
      }
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
    expect(fillStyles.zIndex).toBe(1);
    expect(calculateDragStyle(context).zIndex).toBe(2);
  });

  it("holds the order when the fill's transform is overridden", () => {
    const fill = { ...fillStyles, transform: "none" };

    expect(Number(fill.zIndex)).toBeGreaterThan(
      Number(backgroundStyles.zIndex),
    );
  });

  it("leaves the background a full-size grid layer", () => {
    expect(backgroundStyles).toEqual({ ...progressStyles, zIndex: 0 });
  });
});

/**
 * C10, S29. The fraction does not depend on the track's length, so it is right
 * before the track is measured; only the pixel offset has to wait.
 */
describe("an unmeasured track", () => {
  const context: StyleContext = {
    value: 30,
    minValue: 0,
    maxValue: 100,
    sliderLength: 0,
    orientation: "horizontal",
  };

  it("still exposes the fill fraction", () => {
    expect(sliderCustomProperties(context)).toEqual({
      "--progress": "0.3",
      "--offset": "0px",
    });
  });

  it("exposes the same fraction at every length once it is measured", () => {
    for (const sliderLength of [1, 1000]) {
      expect(
        sliderCustomProperties({ ...context, sliderLength }),
      ).toHaveProperty("--progress", "0.3");
    }
  });
});

/**
 * S20. The custom properties are the numbers behind the fill and the thumb, so
 * they have to agree with the thumb's transform — and be strings, so React
 * never appends a unit.
 */
describe("sliderCustomProperties", () => {
  const context: StyleContext = {
    value: 0.25,
    minValue: 0,
    maxValue: 1,
    sliderLength: 200,
    orientation: "horizontal",
  };

  it("exposes the fill fraction unitless and the offset in px", () => {
    expect(sliderCustomProperties(context)).toEqual({
      "--progress": "0.25",
      "--offset": "50px",
    });
  });

  it("agrees with the thumb's transform", () => {
    expect(calculateDragStyle(context).transform).toBe(
      "translate(calc(50px - 50%), 0)",
    );
  });

  // Away from 0.5, the fixed point where an inverted and a non-inverted rule
  // agree, so this pins that the offset runs the way the thumb does.
  it("measures a vertical offset from the top, as the thumb does", () => {
    const vertical = { ...context, orientation: "vertical" as const };
    const offset = sliderCustomProperties(vertical) as Record<string, string>;

    expect(calculateDragStyle(vertical).transform).toBe(
      `translate(0, calc(${offset["--offset"]} - 50%))`,
    );
    expect(offset["--progress"]).toBe("0.25");
  });

  it("maps through the slider's own range", () => {
    expect(
      sliderCustomProperties({
        ...context,
        minValue: 0.5,
        maxValue: 2.5,
        value: 1.5,
      }),
    ).toHaveProperty("--progress", "0.5");
  });

  /**
   * S29. `PlaybackRate.Set` takes rates past the rate slider's bounds — 8x on
   * the default 0.5–4 gave 2.14 — and Chrome can report a `currentTime` past
   * `duration` at `ended`.
   */
  it.each([
    ["above", 8, "1", "200px", "translate(calc(200px - 50%), 0)"],
    ["below", 0.25, "0", "0px", "translate(calc(0px - 50%), 0)"],
  ])(
    "clamps a value %s the range to the track",
    (_, value, progress, offset, thumb) => {
      const rate = { ...context, minValue: 0.5, maxValue: 4, value };

      expect(sliderCustomProperties(rate)).toEqual({
        "--progress": progress,
        "--offset": offset,
      });
      expect(calculateDragStyle(rate).transform).toBe(thumb);
    },
  );

  it("clamps a vertical offset to the track, from the top", () => {
    const vertical = { ...context, orientation: "vertical" as const };

    expect(sliderCustomProperties({ ...vertical, value: 2 })).toEqual({
      "--progress": "1",
      "--offset": "0px",
    });
    expect(sliderCustomProperties({ ...vertical, value: -1 })).toEqual({
      "--progress": "0",
      "--offset": "200px",
    });
  });
});
