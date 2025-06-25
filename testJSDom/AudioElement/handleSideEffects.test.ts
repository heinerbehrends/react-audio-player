import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSideEffect } from "../../src/AudioElement/handleSideEffect";

const defaultSliderState = {
  component: "timeline" as const,
  clientXY: 50,
  sliderLength: 100,
  sliderStart: 0,
  orientation: "horizontal" as const,
  maxValue: 200,
  minValue: 0,
  step: 0,
  offsetFromMiddle: 0,
};

describe("handleSideEffect", () => {
  let audioElement: HTMLAudioElement;

  beforeEach(() => {
    audioElement = {
      play: vi.fn(),
      pause: vi.fn(),
      currentTime: 0,
      volume: 1,
      paused: true,
      muted: false,
      playbackRate: 1,
    } as unknown as HTMLAudioElement;
  });

  it("should do nothing if audio element is null", () => {
    const result = handleSideEffect({ type: "TOGGLE_PLAY" }, null);
    expect(result).toBeUndefined();
  });

  it("should handle PLAY and PAUSE action", () => {
    handleSideEffect({ type: "PLAY" }, audioElement);
    expect(audioElement.play).toHaveBeenCalled();

    audioElement = {
      ...audioElement,
      paused: false,
    } as HTMLAudioElement;
    handleSideEffect({ type: "PAUSE" }, audioElement);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle STOP_AUDIO action", () => {
    handleSideEffect({ type: "STOP_AUDIO" }, audioElement);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle AUDIO_FILE_ENDED action", () => {
    audioElement.currentTime = 42;
    handleSideEffect({ type: "AUDIO_FILE_ENDED" }, audioElement);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle TOGGLE_MUTE action", () => {
    handleSideEffect(
      {
        type: "TOGGLE_MUTE",
      },
      audioElement,
    );
    expect(audioElement.muted).toBe(true);

    handleSideEffect(
      {
        type: "TOGGLE_MUTE",
      },
      audioElement,
    );
    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(1);
  });

  it("should handle UNMUTE action", () => {
    audioElement.muted = true;
    handleSideEffect({ type: "UNMUTE" }, audioElement);
    expect(audioElement.muted).toBe(false);
  });

  it("should unmute if muted and volume is set above 0 on CHANGE_VALUE", () => {
    audioElement.muted = true;
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "volume", value: 0.5 },
      audioElement,
    );
    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(0.5);
  });

  it("should handle CHANGE_VALUE action for volume", () => {
    handleSideEffect(
      {
        type: "CHANGE_VALUE",
        component: "volume",
        value: 0.7,
      },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.7);
  });

  it("should handle SET_SLIDER_VALUE action for timeline", () => {
    handleSideEffect(
      {
        type: "SET_SLIDER_VALUE",
        ...defaultSliderState,
      },
      audioElement,
    );
    expect(audioElement.currentTime).toBe(100);
  });

  it("should handle SET_SLIDER_VALUE action for volume", () => {
    handleSideEffect(
      {
        type: "SET_SLIDER_VALUE",
        ...defaultSliderState,
        component: "volume",
        maxValue: 1,
      },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.5);
  });

  it("should snap to the nearest step on SET_SLIDER_VALUE action for playback rate", () => {
    handleSideEffect(
      {
        type: "SET_SLIDER_VALUE",
        ...defaultSliderState,
        clientXY: 30,
        maxValue: 2,
        component: "playbackRate",
        minValue: 0.5,
        step: 0.25,
      },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1);
    handleSideEffect(
      {
        type: "SET_SLIDER_VALUE",
        ...defaultSliderState,
        maxValue: 2,
        minValue: 0.5,
        step: 0.25,
        component: "playbackRate",
        clientXY: 60,
      },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });

  it("should handle DRAG_END action for timeline", () => {
    handleSideEffect(
      {
        type: "DRAG_END",
        ...defaultSliderState,
      },
      audioElement,
    );
    expect(audioElement.currentTime).toBe(100);
  });

  it("should ignore DRAG_END action for playback rate and volume", () => {
    handleSideEffect(
      {
        type: "DRAG_END",
        ...defaultSliderState,
        maxValue: 2,
        minValue: 0.5,
        step: 0.1,
        component: "playbackRate",
      },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1);
    handleSideEffect(
      {
        type: "DRAG_END",
        ...defaultSliderState,
        component: "volume",
        maxValue: 1,
      },
      audioElement,
    );
    expect(audioElement.volume).toBe(1);
  });

  it("should change the current time on CHANGE_VALUE action for timeline", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "timeline", value: 10 },
      audioElement,
    );
    expect(audioElement.currentTime).toBe(10);
  });

  it("should change the volume on CHANGE_VALUE action for volume", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "volume", value: 0.5 },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.5);
  });

  it("should change the playback rate on CHANGE_VALUE action for playback rate", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "playbackRate", value: 1.5 },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });

  it("should ignore DRAG action for timeline", () => {
    handleSideEffect(
      {
        type: "DRAG",
        ...defaultSliderState,
      },
      audioElement,
    );
    expect(audioElement.currentTime).toBe(0);
  });

  it("should set the right volume value on DRAG event for volume", () => {
    handleSideEffect(
      {
        type: "DRAG",
        ...defaultSliderState,
        maxValue: 1,
        component: "volume",
      },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.5);
  });

  it("should snap playbackRate to the nearest step on DRAG event for playbackRate", () => {
    handleSideEffect(
      {
        type: "DRAG",
        ...defaultSliderState,
        clientXY: 30,
        component: "playbackRate",
        maxValue: 2,
        minValue: 0.5,
        step: 0.25,
      },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1);
    handleSideEffect(
      {
        type: "DRAG",
        ...defaultSliderState,
        component: "playbackRate",
        clientXY: 60,
        maxValue: 2,
        minValue: 0.5,
        step: 0.25,
      },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });
  it("should handle SET_PLAYBACK_RATE action", () => {
    handleSideEffect(
      { type: "SET_PLAYBACK_RATE", playbackRate: 1.5 },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });
});
