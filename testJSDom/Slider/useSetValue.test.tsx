import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSetValue } from "../../src/Slider/dragHooks";
import { createSliderContext } from "../testUtils";
import type { SliderEvent } from "../../src/Slider/SliderContext";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect.ts", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("useSetValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a function", () => {
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
    });

    const { result } = renderHook(() => useSetValue(context));
    expect(typeof result.current).toBe("function");
  });

  it("calls handleSideEffect with SET_SLIDER_VALUE on pointer down", () => {
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
      sliderStart: 0,
      sliderLength: 100,
    });

    const { result } = renderHook(() => useSetValue(context));
    const button = document.createElement("button");
    const setValue = result.current;

    act(() => {
      const event = new Event("pointerdown", { bubbles: true });
      Object.defineProperties(event, {
        clientX: { value: 50 },
        clientY: { value: 0 },
        target: { value: button },
        currentTarget: { value: button },
      });

      const mockEvent = {
        nativeEvent: event,
        currentTarget: button,
        target: button,
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: 50,
        clientY: 0,
        type: "pointerdown",
      } as unknown as SliderEvent;

      setValue(mockEvent);
    });

    expect(mockHandleSideEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SET_SLIDER_VALUE",
        component: "timeline",
        clientXY: 50,
      }),
    );
  });

  it("sets up pointer move/up listeners on pointer down", () => {
    const handleSliderAction = vi.fn();
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
      handleSliderAction,
    });

    const addEventListenerSpy = vi.spyOn(document, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { result } = renderHook(() => useSetValue(context));
    const button = document.createElement("button");
    const setValue = result.current;

    act(() => {
      const event = new Event("pointerdown", { bubbles: true });
      Object.defineProperties(event, {
        clientX: { value: 50 },
        clientY: { value: 0 },
        target: { value: button },
        currentTarget: { value: button },
      });

      const reactEvent = {
        nativeEvent: event,
        currentTarget: button,
        target: button,
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: 50,
        clientY: 0,
        type: "pointerdown",
      } as unknown as SliderEvent;

      setValue(reactEvent);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );

    act(() => {
      const pointerUpEvent = new Event("pointerup");
      document.dispatchEvent(pointerUpEvent);
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("calls handleSliderAction with DRAG_START when pointer moves", () => {
    const handleSliderAction = vi.fn();
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
      handleSliderAction,
    });

    const { result } = renderHook(() => useSetValue(context));
    const button = document.createElement("button");
    const setValue = result.current;

    act(() => {
      const event = new Event("pointerdown", { bubbles: true });
      Object.defineProperties(event, {
        clientX: { value: 50 },
        clientY: { value: 0 },
        target: { value: button },
        currentTarget: { value: button },
      });

      const reactEvent = {
        nativeEvent: event,
        currentTarget: button,
        target: button,
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: 50,
        clientY: 0,
        type: "pointerdown",
      } as unknown as SliderEvent;

      setValue(reactEvent);

      const pointerMoveEvent = new Event("pointermove", { bubbles: true });
      Object.defineProperties(pointerMoveEvent, {
        clientX: { value: 60 },
        clientY: { value: 0 },
      });
      document.dispatchEvent(pointerMoveEvent);
    });

    expect(handleSliderAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DRAG_START",
        clientXY: 60,
      }),
    );
  });

  it("cleans up event listeners on pointer up", () => {
    const handleSliderAction = vi.fn();
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
      handleSliderAction,
    });

    const { result } = renderHook(() => useSetValue(context));
    const setValue = result.current;

    const event = new Event("pointerdown") as unknown as SliderEvent;
    Object.defineProperty(event, "clientX", { value: 50 });
    Object.defineProperty(event, "clientY", { value: 0 });
    setValue(event);

    const upEvent = new Event("pointerup") as unknown as Event;
    document.dispatchEvent(upEvent);

    const moveEvent = new Event("pointermove") as unknown as Event;
    Object.defineProperty(moveEvent, "clientX", { value: 70 });
    Object.defineProperty(moveEvent, "clientY", { value: 0 });
    document.dispatchEvent(moveEvent);

    expect(handleSliderAction).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DRAG_START",
        clientXY: 70,
      }),
    );
  });

  it("calls handleSideEffect with SET_SLIDER_VALUE on initial pointer down", () => {
    mockHandleSideEffect.mockClear();
    const context = createSliderContext({
      component: "timeline",
      minValue: 0,
      maxValue: 1,
    });

    const { result } = renderHook(() => useSetValue(context));
    const setValue = result.current;

    const event = new Event("pointerdown") as unknown as SliderEvent;
    Object.defineProperty(event, "clientX", { value: 50 });
    Object.defineProperty(event, "clientY", { value: 0 });
    setValue(event);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "SET_SLIDER_VALUE",
      ...context,
      clientXY: 50,
    });
  });
});
