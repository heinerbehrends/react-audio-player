import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useResizeObserver } from "../../src/Slider/useHandleRef";
import { createSliderContext } from "../testUtils";
import React from "react";

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

describe("useResizeObserver", () => {
  let mockHandleSliderAction: ReturnType<typeof vi.fn>;
  let buttonRef: React.MutableRefObject<HTMLButtonElement | null>;
  let context: ReturnType<typeof createSliderContext>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ResizeObserver constructor
    global.ResizeObserver = mockResizeObserver.mockImplementation(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
    }));

    mockHandleSliderAction = vi.fn();
    buttonRef = { current: null };
    context = createSliderContext({
      handleSliderAction: mockHandleSliderAction,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create a ResizeObserver when hook is called", () => {
    renderHook(() => useResizeObserver(context, buttonRef));

    expect(mockResizeObserver).toHaveBeenCalledTimes(1);
  });

  it("should observe the button element when it exists", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;

    renderHook(() => useResizeObserver(context, buttonRef));

    expect(mockObserve).toHaveBeenCalledWith(mockButton);
  });

  it("should not observe when button ref is null", () => {
    renderHook(() => useResizeObserver(context, buttonRef));

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should call handleSliderAction with correct data for horizontal orientation", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;

    // Mock getBoundingClientRect for horizontal orientation
    const mockRect = {
      left: 100,
      top: 50,
      width: 200,
      height: 30,
    };
    mockButton.getBoundingClientRect = vi.fn().mockReturnValue(mockRect);

    renderHook(() => useResizeObserver(context, buttonRef));

    // Simulate ResizeObserver callback
    const resizeCallback = mockResizeObserver.mock.calls[0]?.[0];
    if (resizeCallback) {
      resizeCallback();
    }

    expect(mockHandleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 100, // left for horizontal
      sliderLength: 200, // width for horizontal
    });
  });

  it("should call handleSliderAction with correct data for vertical orientation", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;
    context = createSliderContext({
      handleSliderAction: mockHandleSliderAction,
      orientation: "vertical",
    });

    // Mock getBoundingClientRect for vertical orientation
    const mockRect = {
      left: 100,
      top: 50,
      width: 200,
      height: 300,
    };
    mockButton.getBoundingClientRect = vi.fn().mockReturnValue(mockRect);

    renderHook(() => useResizeObserver(context, buttonRef));

    // Simulate ResizeObserver callback
    const resizeCallback = mockResizeObserver.mock.calls[0]?.[0];
    if (resizeCallback) {
      resizeCallback();
    }

    expect(mockHandleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 50, // top for vertical
      sliderLength: 300, // height for vertical
    });
  });

  it("should not call handleSliderAction when button rect is null", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;

    // Mock getBoundingClientRect to return null
    mockButton.getBoundingClientRect = vi.fn().mockReturnValue(null);

    renderHook(() => useResizeObserver(context, buttonRef));

    // Simulate ResizeObserver callback
    const resizeCallback = mockResizeObserver.mock.calls[0]?.[0];
    if (resizeCallback) {
      resizeCallback();
    }

    expect(mockHandleSliderAction).not.toHaveBeenCalled();
  });

  it("should not call handleSliderAction when button ref is null in callback", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;

    renderHook(() => useResizeObserver(context, buttonRef));

    // Simulate ResizeObserver callback after setting ref to null
    const resizeCallback = mockResizeObserver.mock.calls[0]?.[0];
    buttonRef.current = null;
    if (resizeCallback) {
      resizeCallback();
    }

    expect(mockHandleSliderAction).not.toHaveBeenCalled();
  });

  it("should disconnect ResizeObserver on cleanup", () => {
    const { unmount } = renderHook(() => useResizeObserver(context, buttonRef));

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("should recreate ResizeObserver when dependencies change", () => {
    const { rerender } = renderHook(
      ({ context, buttonRef }) => useResizeObserver(context, buttonRef),
      {
        initialProps: { context, buttonRef },
      },
    );

    // Change orientation to trigger dependency change
    const newContext = createSliderContext({
      ...context,
      orientation: "vertical",
    });

    rerender({ context: newContext, buttonRef });

    expect(mockResizeObserver).toHaveBeenCalledTimes(2);
  });

  it("should handle multiple resize events correctly", () => {
    const mockButton = document.createElement("button");
    buttonRef.current = mockButton;

    const mockRect1 = { left: 100, top: 50, width: 200, height: 30 };
    const mockRect2 = { left: 150, top: 75, width: 250, height: 40 };

    mockButton.getBoundingClientRect = vi
      .fn()
      .mockReturnValueOnce(mockRect1)
      .mockReturnValueOnce(mockRect2);

    renderHook(() => useResizeObserver(context, buttonRef));

    const resizeCallback = mockResizeObserver.mock.calls[0]?.[0];
    if (!resizeCallback) {
      throw new Error("ResizeObserver callback not found");
    }

    // First resize event
    resizeCallback();
    expect(mockHandleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 100,
      sliderLength: 200,
    });

    // Second resize event
    resizeCallback();
    expect(mockHandleSliderAction).toHaveBeenCalledWith({
      type: "SLIDER_LOADED",
      sliderStart: 150,
      sliderLength: 250,
    });

    expect(mockHandleSliderAction).toHaveBeenCalledTimes(2);
  });
});
