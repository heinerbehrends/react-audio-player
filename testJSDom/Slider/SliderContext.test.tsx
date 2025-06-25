import { describe, it, expect } from "vitest";
import { initialSliderState } from "../../src/Slider/SliderContext";

describe("initialState", () => {
  it("has correct default values", () => {
    expect(initialSliderState).toEqual({
      sliderStart: 0,
      sliderLength: 0,
      value: 0,
      minValue: 0,
      maxValue: 1,
      clientXY: 0,
      dragState: "idle",
      orientation: "horizontal",
      handleSliderAction: expect.any(Function),
      step: 0,
      component: "timeline",
      offsetFromMiddle: 0,
    });
  });
});
