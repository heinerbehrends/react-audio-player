import { describe, it, expect } from "vitest";
import { timelineReducer } from "../../src/Timeline/timelineReducer";
import { createSliderContext } from "../testUtils";

const defaultState = createSliderContext({
  component: "timeline" as const,
  sliderStart: 100,
  sliderLength: 200,
  minValue: 0,
  maxValue: 1,
  value: 0.5,
});

describe("timelineReducer", () => {
  it("should handle UPDATE_UI_VALUE action", () => {
    const action = {
      type: "UPDATE_UI_VALUE" as const,
      component: "timeline" as const,
      value: 0.75,
    };

    const newState = timelineReducer(defaultState, action);
    expect(newState.value).toBe(0.75);
  });

  it("should ignore UPDATE_UI_VALUE for non-timeline components", () => {
    const action = {
      type: "UPDATE_UI_VALUE" as const,
      component: "volume" as const,
      value: 0.75,
    };

    const newState = timelineReducer(defaultState, action);
    expect(newState.value).toBe(0.5);
  });

  it("should handle SLIDER_LOADED action", () => {
    const action = {
      type: "SLIDER_LOADED" as const,
      sliderStart: 150,
      sliderLength: 300,
    };

    const newState = timelineReducer(defaultState, action);
    expect(newState.sliderStart).toBe(150);
    expect(newState.sliderLength).toBe(300);
  });

  it("should handle SET_MAX_VALUE action", () => {
    const action = {
      type: "SET_MAX_VALUE" as const,
      maxValue: 2,
    };

    const newState = timelineReducer(defaultState, action);
    expect(newState.maxValue).toBe(2);
  });

  it("should handle DRAG_START action", () => {
    const action = {
      type: "DRAG_START" as const,
      ...defaultState,
      clientXY: 150,
      sliderStart: 100,
      sliderLength: 200,
    };

    const newState = timelineReducer(defaultState, action);
    expect(newState.dragState).toBe("dragging");
    expect(newState.clientXY).toBe(100);
  });

  it("should handle DRAG action", () => {
    const state = { ...defaultState, dragState: "dragging" as const };
    const action = {
      type: "DRAG" as const,
      ...defaultState,
      clientXY: 250,
      sliderStart: 100,
      sliderLength: 200,
    };

    const newState = timelineReducer(state, action);
    expect(newState.clientXY).toBe(150);
  });

  it("should handle DRAG_END action", () => {
    const state = {
      ...defaultState,
      dragState: "dragging" as const,
      clientXY: 100,
    };
    const action = {
      type: "DRAG_END" as const,
      ...defaultState,
      clientXY: 200,
      sliderStart: 100,
      sliderLength: 200,
    };

    const newState = timelineReducer(state, action);
    expect(newState.dragState).toBe("idle");
    expect(newState.clientXY).toBe(0);
    expect(newState.value).toBe(0.5);
  });

  it("should handle CANCEL_DRAG action", () => {
    const state = {
      ...defaultState,
      dragState: "dragging" as const,
      clientXY: 100,
    };
    const action = {
      type: "CANCEL_DRAG" as const,
    };

    const newState = timelineReducer(state, action);
    expect(newState.dragState).toBe("idle");
    expect(newState.clientXY).toBe(0);
  });

  it("should reset offsetFromMiddle on DRAG_END", () => {
    const state = {
      ...defaultState,
      dragState: "dragging" as const,
      clientXY: 100,
      offsetFromMiddle: 50,
    };
    const action = {
      type: "DRAG_END" as const,
      ...defaultState,
      clientXY: 200,
      sliderStart: 100,
      sliderLength: 200,
    };

    const newState = timelineReducer(state, action);
    expect(newState.offsetFromMiddle).toBe(0);
  });

  it("should reset offsetFromMiddle on CANCEL_DRAG", () => {
    const state = {
      ...defaultState,
      dragState: "dragging" as const,
      clientXY: 100,
      offsetFromMiddle: 50,
    };
    const action = {
      type: "CANCEL_DRAG" as const,
    };

    const newState = timelineReducer(state, action);
    expect(newState.offsetFromMiddle).toBe(0);
  });
});
