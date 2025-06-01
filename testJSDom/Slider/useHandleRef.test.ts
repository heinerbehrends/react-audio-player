/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHandleRef } from "../../src/Slider/useHandleRef";
import { SliderContextType } from "../../src/Slider/SliderContext";

const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

beforeAll(() => {
  global.ResizeObserver = mockResizeObserver;
});

afterAll(() => {
  (global as any).ResizeObserver = undefined;
});

describe("useHandleRef", () => {
  const createSliderContext = (overrides = {}): SliderContextType => ({
    handleSliderAction: vi.fn(),
    orientation: "horizontal" as const,
    ...overrides,
    clientXY: 0,
    sliderStart: 0,
    sliderLength: 0,
    minValue: 0,
    maxValue: 1,
    step: 0,
    component: "timeline" as const,
    value: 1,
    dragState: "idle" as const,
  });

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

  it("cleans up ResizeObserver on unmount", () => {
    const context = createSliderContext();
    const mockDisconnect = vi.fn();
    const mockObserve = vi.fn();
    const mockResizeObserver = vi.fn(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
    }));
    (global as any).ResizeObserver = mockResizeObserver;

    const { result, unmount } = renderHook(() => useHandleRef(context));

    const mockElement = {
      getBoundingClientRect: () => ({
        left: 100,
        width: 200,
        top: 50,
        height: 20,
      }),
    } as HTMLButtonElement;

    result.current(mockElement);
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
