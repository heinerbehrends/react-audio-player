import { describe, it, expect } from "vitest";
import {
  calculateDragStyle,
  calculateProgressStyle,
  progressStyles,
  containerStyles,
  buttonStyles,
} from "../../src/Slider/calculateStyle";
import { createSliderContext } from "../testUtils";

describe("calculateStyle", () => {
  const defaultContext = createSliderContext({
    value: 0.5,
    sliderStart: 0,
    minValue: 0,
    maxValue: 1,
    step: 0.1,
    sliderLength: 100,
  });
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

    it("handles dragging state", () => {
      const context = {
        ...defaultContext,
        dragState: "dragging" as const,
        clientXY: 75,
        step: 0,
      };
      const style = calculateDragStyle(context);

      expect(style.transform).toBe("translate(calc(50px - 20px), 0)");
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
        component: "volume" as const,
        value: 0.5,
      };
      const style = calculateProgressStyle(context);

      expect(style).toEqual({
        transform: "scaleY(0.5)",
        transformOrigin: "bottom",
      });
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
