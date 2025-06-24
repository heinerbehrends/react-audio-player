import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useHandleDragStart,
  useHandleDrag,
  useHandleDragEnd,
  useOnPointerCancel,
  useSetValue,
} from "../../src/Slider/dragHooks";
import { PlayerContext } from "../../src/Player/PlayerContext";
import type { PointerEvent } from "react";
import { createSliderContext, createPlayerContext } from "../testUtils";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("dragHooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useHandleDragStart", () => {
    it("handles drag start for timeline", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useHandleDragStart(context), {
        wrapper: ({ children }) => (
          <PlayerContext.Provider value={createPlayerContext()}>
            {children}
          </PlayerContext.Provider>
        ),
      });

      const event = {
        clientX: 50,
        clientY: 0,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            width: 40,
            top: 0,
            height: 20,
          }),
        },
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledTimes(1);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_START",
        ...context,
        clientXY: 50,
        offsetFromMiddle: 30,
      });
    });

    it("handles drag start for volume slider", () => {
      const context = createSliderContext({ component: "volume" });
      const { result } = renderHook(() => useHandleDragStart(context), {
        wrapper: ({ children }) => (
          <PlayerContext.Provider value={createPlayerContext()}>
            {children}
          </PlayerContext.Provider>
        ),
      });

      const event = {
        clientX: 50,
        clientY: 0,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            width: 40,
            top: 0,
            height: 20,
          }),
        },
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(mockHandleSideEffect).toHaveBeenCalledTimes(2);
      expect(mockHandleSideEffect).toHaveBeenNthCalledWith(1, {
        type: "UNMUTE",
      });
      expect(mockHandleSideEffect).toHaveBeenNthCalledWith(2, {
        type: "DRAG_START",
        ...context,
        clientXY: 50,
        offsetFromMiddle: 30,
      });
      expect(context.handleSliderAction).toHaveBeenCalledTimes(1);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_START",
        ...context,
        clientXY: 50,
        offsetFromMiddle: 30,
      });
    });
  });

  describe("useHandleDrag", () => {
    it("handles drag when in dragging state", () => {
      const context = createSliderContext({ dragState: "dragging" });
      const { result } = renderHook(() => useHandleDrag(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledTimes(1);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG",
        ...context,
        clientXY: 60,
      });
    });

    it("does not handle drag when not in dragging state", () => {
      // Create a fresh context with a new spy for this test
      const context = createSliderContext({ dragState: "idle" });
      const { result } = renderHook(() => useHandleDrag(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).not.toHaveBeenCalled();
    });
  });

  describe("useHandleDragEnd", () => {
    it("handles drag end", () => {
      const context = createSliderContext({ dragState: "dragging" });
      const { result } = renderHook(() => useHandleDragEnd(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledTimes(1);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_END",
        ...context,
        clientXY: 60,
      });
    });
  });

  describe("useOnPointerCancel", () => {
    it("handles pointer cancel", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useOnPointerCancel(context));

      result.current();

      expect(context.handleSliderAction).toHaveBeenCalledTimes(1);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "CANCEL_DRAG",
      });
    });
  });

  describe("useSetValue", () => {
    it("sets slider value", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useSetValue(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(mockHandleSideEffect).toHaveBeenCalledTimes(1);
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_SLIDER_VALUE",
        ...context,
        clientXY: 60,
      });
      expect(context.handleSliderAction).not.toHaveBeenCalled();
    });
  });
});
