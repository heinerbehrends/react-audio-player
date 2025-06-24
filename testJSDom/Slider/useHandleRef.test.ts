/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHandleRef } from "../../src/Slider/useHandleRef";
import { createSliderContext } from "../testUtils";

describe("useHandleRef", () => {
  it("handles horizontal orientation", () => {
    const context = createSliderContext();
    const { result } = renderHook(() => useHandleRef(context));

    const mockElement = {
      getBoundingClientRect: () => ({
        left: 100,
        width: 200,
        top: 50,
        height: 20,
      }),
    } as HTMLButtonElement;

    result.current(mockElement);

    expect(context.handleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 100,
      sliderLength: 200,
    });
  });

  it("handles vertical orientation", () => {
    const context = createSliderContext({ orientation: "vertical" });
    const { result } = renderHook(() => useHandleRef(context));

    const mockElement = {
      getBoundingClientRect: () => ({
        left: 100,
        width: 200,
        top: 50,
        height: 20,
      }),
    } as HTMLButtonElement;

    result.current(mockElement);

    expect(context.handleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 50,
      sliderLength: 20,
    });
  });

  it("handles null element", () => {
    const context = createSliderContext();
    const { result } = renderHook(() => useHandleRef(context));

    result.current(null);

    expect(context.handleSliderAction).not.toHaveBeenCalled();
  });
});
