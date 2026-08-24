import { describe, it, expect } from "vitest";
import {
  formatTime,
  areNumbersClose,
  calculateValue,
  calculateSteppedValue,
  calculateSliderValue,
  getOffset,
  getClientXY,
} from "../../src/Shared/sharedFunctions";
import type { SliderEvent } from "../../src/Slider/SliderContext";

describe("sharedFunctions", () => {
  describe("areNumbersClose", () => {
    it("returns true for numbers within 0.001 of each other", () => {
      expect(areNumbersClose(1.0001, 1)).toBe(true);
      expect(areNumbersClose(1, 1.0001)).toBe(true);
      expect(areNumbersClose(0.9999, 1)).toBe(true);
    });

    it("returns false for numbers more than 0.001 apart", () => {
      expect(areNumbersClose(1.002, 1)).toBe(false);
      expect(areNumbersClose(1, 1.002)).toBe(false);
      expect(areNumbersClose(0.998, 1)).toBe(false);
    });

    it("handles zero values", () => {
      expect(areNumbersClose(0, 0.0001)).toBe(true);
      expect(areNumbersClose(0, 0.002)).toBe(false);
    });
  });

  describe("calculateValue", () => {
    it("calculates horizontal value correctly", () => {
      const result = calculateValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
        orientation: "horizontal",
        minValue: 0,
        maxValue: 1,
      });
      expect(result).toBeCloseTo(0.5);
    });

    it("calculates vertical value correctly", () => {
      const result = calculateValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
        orientation: "vertical",
        minValue: 0,
        maxValue: 1,
      });
      expect(result).toBeCloseTo(0.5);
    });

    it("clamps values to min and max", () => {
      const result = calculateValue({
        clientXY: 150,
        sliderLength: 100,
        sliderStart: 0,
        minValue: 0,
        maxValue: 1,
      });
      expect(result).toBeCloseTo(1);
    });

    it("uses default values when not provided", () => {
      const result = calculateValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
      });
      expect(result).toBeCloseTo(0.5);
    });
  });

  describe("calculateSteppedValue", () => {
    it("calculates stepped value correctly", () => {
      const result = calculateSteppedValue({
        value: 0.71,
        minValue: 0,
        maxValue: 1,
        step: 0.2,
      });
      expect(result).toBeCloseTo(0.8);
    });

    it("clamps to min and max values", () => {
      const result = calculateSteppedValue({
        value: 1.2,
        minValue: 0,
        maxValue: 1,
        step: 0.2,
      });
      expect(result).toBeCloseTo(1);
    });

    it("handles zero step value", () => {
      const result = calculateSteppedValue({
        value: 0.7,
        minValue: 0,
        maxValue: 1,
        step: 0,
      });
      expect(result).toBeCloseTo(0.7);
    });
  });

  describe("calculateSliderValue", () => {
    it("calculates value without step", () => {
      const result = calculateSliderValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
        minValue: 0,
        maxValue: 1,
      });
      expect(result).toBeCloseTo(0.5);
    });

    it("calculates value with step", () => {
      const result = calculateSliderValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
        minValue: 0,
        maxValue: 1,
        step: 0.2,
      });
      expect(result).toBeCloseTo(0.6);
    });

    it("uses default values when not provided", () => {
      const result = calculateSliderValue({
        clientXY: 50,
        sliderLength: 100,
        sliderStart: 0,
      });
      expect(result).toBeCloseTo(0.5);
    });
  });

  describe("getOffset", () => {
    it("returns clientXY when dragging without step", () => {
      const result = getOffset({
        value: 0.5,
        sliderLength: 100,
        clientXY: 50,
        dragState: "dragging",
        minValue: 0,
        maxValue: 1,
        component: "timeline",
      });
      expect(result).toBeCloseTo(50);
    });

    it("calculates horizontal offset correctly", () => {
      const result = getOffset({
        value: 0.5,
        sliderLength: 100,
        clientXY: 50,
        dragState: "idle",
        minValue: 0,
        maxValue: 1,
        orientation: "horizontal",
        component: "timeline",
      });
      expect(result).toBe(50);
    });

    it("calculates vertical offset correctly", () => {
      const result = getOffset({
        value: 0.5,
        sliderLength: 100,
        clientXY: 50,
        dragState: "idle",
        minValue: 0,
        maxValue: 1,
        orientation: "vertical",
        component: "timeline",
      });
      expect(result).toBe(50);
    });

    it("uses default values when not provided", () => {
      const result = getOffset({
        value: 0.5,
        sliderLength: 100,
        clientXY: 50,
        dragState: "idle",
        component: "timeline",
      });
      expect(result).toBe(50);
    });
  });

  describe("getClientXY", () => {
    it("handles mouse events", () => {
      const mouseEvent = {
        clientX: 100,
        clientY: 200,
      } as unknown as SliderEvent;

      expect(getClientXY(mouseEvent, "horizontal")).toBe(100);
      expect(getClientXY(mouseEvent, "vertical")).toBe(200);
    });

    it("handles touch events", () => {
      const touchEvent = {
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as SliderEvent;

      expect(getClientXY(touchEvent, "horizontal")).toBe(100);
      expect(getClientXY(touchEvent, "vertical")).toBe(200);
    });

    it("handles touch events with no touches", () => {
      const touchEvent = {
        touches: [],
      } as unknown as SliderEvent;

      expect(getClientXY(touchEvent, "horizontal")).toBe(0);
      expect(getClientXY(touchEvent, "vertical")).toBe(0);
    });
  });

  describe("formatTime", () => {
    it.each([
      [0, "0:00"],
      [65, "1:05"],
      [120, "2:00"],
      [121, "2:01"],
      [3599, "59:59"],
      [3600, "1:00:00"],
      [3661, "1:01:01"],
      [7325, "2:02:05"],
    ])("formats %i as %s", (input, expected) => {
      expect(formatTime(input)).toBe(expected);
    });

    // One clamp covers all three: reachable from a live stream, from a corrupt
    // file, from `duration` before metadata, and from `duration - currentSecond`
    // while duration is still `NaN`.
    it.each([
      [-5, "0:00"],
      [NaN, "0:00"],
      [Infinity, "0:00"],
      [-Infinity, "0:00"],
    ])("renders %p as %s rather than garbage", (input, expected) => {
      expect(formatTime(input)).toBe(expected);
    });
  });
});
