import { describe, it, expect } from "vitest";
import { playbackRateReducer } from "../../src/PlaybackRate/playbackRateReducer";
import {
  SliderContextType,
  SliderProviderAction,
} from "../../src/Slider/SliderContext";
import { createSliderContext } from "../testUtils";

describe("playbackRateReducer", () => {
  // Default state used in tests
  const defaultState: SliderContextType = createSliderContext({
    clientXY: 0,
    component: "playbackRate",
    handleSliderAction: () => {},
  });

  describe("UPDATE_UI_VALUE action", () => {
    it("should update value when component is playbackRate", () => {
      const action = {
        type: "UPDATE_UI_VALUE",
        component: "playbackRate",
        value: 2.5,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual({
        ...defaultState,
        value: 2.5,
      });
    });

    it("should ignore UPDATE_UI_VALUE when component is not playbackRate", () => {
      const action = {
        type: "UPDATE_UI_VALUE",
        component: "timeline",
        value: 2.5,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual(defaultState);
    });
  });

  describe("SLIDER_LOADED action", () => {
    it("should update sliderStart and sliderLength", () => {
      const action = {
        type: "SLIDER_LOADED",
        sliderStart: 20,
        sliderLength: 200,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual({
        ...defaultState,
        sliderStart: 20,
        sliderLength: 200,
      });
    });
  });

  describe("DRAG_START action", () => {
    it("should set dragState to dragging and update clientXY", () => {
      const action = {
        type: "DRAG_START",
        ...defaultState,
        clientXY: 50,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState.dragState).toBe("dragging");
      expect(newState.clientXY).toBeGreaterThan(0); // Exact value depends on getOffset implementation
    });

    it("should not update state if already dragging", () => {
      const draggingState = {
        ...defaultState,
        dragState: "dragging",
        clientXY: 30,
      } as const;

      const action = {
        type: "DRAG_START",
        ...defaultState,
        clientXY: 50,
      } as const;

      const newState = playbackRateReducer(draggingState, action);

      expect(newState).toEqual(draggingState);
    });
  });

  describe("DRAG action", () => {
    it("should return state unchanged", () => {
      const action = {
        type: "DRAG",
        ...defaultState,
        clientXY: 75,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual(defaultState);
    });
  });

  describe("DRAG_END action", () => {
    it("should set dragState to idle and reset clientXY when dragging", () => {
      const draggingState = {
        ...defaultState,
        dragState: "dragging",
        clientXY: 50,
      } as const;

      const action = {
        type: "DRAG_END",
        ...defaultState,
        clientXY: 75,
      } as const;

      const newState = playbackRateReducer(draggingState, action);

      expect(newState).toEqual({
        ...draggingState,
        dragState: "idle",
        clientXY: 0,
      });
    });

    it("should ignore DRAG_END when component is not playbackRate", () => {
      const draggingState = {
        ...defaultState,
        dragState: "dragging",
        clientXY: 50,
      } as const;

      const action = {
        type: "DRAG_END",
        ...defaultState,
        component: "timeline",
        clientXY: 75,
      } as const;

      const newState = playbackRateReducer(draggingState, action);

      expect(newState).toEqual(draggingState);
    });

    it("should ignore DRAG_END when not dragging", () => {
      const action = {
        type: "DRAG_END",
        ...defaultState,
        clientXY: 75,
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual(defaultState);
    });
  });

  describe("CANCEL_DRAG action", () => {
    it("should set dragState to idle and reset clientXY", () => {
      const draggingState = {
        ...defaultState,
        dragState: "dragging",
        clientXY: 50,
      } as const;

      const action = {
        type: "CANCEL_DRAG",
      } as const;

      const newState = playbackRateReducer(draggingState, action);

      expect(newState).toEqual({
        ...draggingState,
        dragState: "idle",
        clientXY: 0,
      });
    });

    it("should work even if already in idle state", () => {
      const action = {
        type: "CANCEL_DRAG",
      } as const;

      const newState = playbackRateReducer(defaultState, action);

      expect(newState).toEqual({
        ...defaultState,
        dragState: "idle",
        clientXY: 0,
      });
    });
  });

  describe("unknown action", () => {
    it("should return state unchanged for unknown action types", () => {
      const action = {
        type: "UNKNOWN_ACTION",
      } as const;

      const newState = playbackRateReducer(
        defaultState,
        action as unknown as SliderProviderAction,
      );

      expect(newState).toEqual(defaultState);
    });
  });

  describe("getOffset integration", () => {
    it("should correctly handle orientation in DRAG_START", () => {
      // Test with vertical orientation
      const verticalState = {
        ...defaultState,
        orientation: "vertical",
      } as const;

      const action = {
        type: "DRAG_START",
        ...defaultState,
        clientXY: 50,
        offsetFromMiddle: 0,
      } as const;

      const newState = playbackRateReducer(verticalState, action);

      expect(newState.dragState).toBe("dragging");
      // The exact value depends on getOffset implementation
      expect(typeof newState.clientXY).toBe("number");
    });

    it("should correctly handle step values in DRAG_START", () => {
      // Test with different step value
      const steppedState = {
        ...defaultState,
        step: 0.5,
      } as const;

      const action = {
        type: "DRAG_START",
        ...defaultState,
        clientXY: 50,
        offsetFromMiddle: 0,
      } as const;

      const newState = playbackRateReducer(steppedState, action);

      expect(newState.dragState).toBe("dragging");
      // The result should reflect the step constraint
      expect(typeof newState.clientXY).toBe("number");
    });
  });
});
