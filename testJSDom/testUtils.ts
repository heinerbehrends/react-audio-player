import { type SliderContextType } from "../src/Slider/SliderContext";
import { type AudioContextType } from "../src/AudioElement/AudioContext";
import { vi } from "vitest";
import React from "react";

const DEFAULT_SLIDER_CONTEXT: SliderContextType = {
  value: 1,
  minValue: 0.5,
  maxValue: 4,
  step: 0.25,
  orientation: "horizontal" as const,
  sliderLength: 100,
  sliderStart: 10,
  clientXY: 50,
  dragState: "idle" as const,
  component: "timeline" as const,
  offsetFromMiddle: 10,
  handleSliderAction: vi.fn(),
};

const DEFAULT_AUDIO_ELEMENT: Partial<HTMLAudioElement> = {
  currentTime: 0,
  volume: 1,
  duration: 100,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

export function createSliderContext(
  overrides: Partial<SliderContextType> = {},
): SliderContextType {
  return {
    ...DEFAULT_SLIDER_CONTEXT,
    handleSliderAction: vi.fn(),
    ...overrides,
  };
}

export function createAudioElement(
  overrides: Partial<HTMLAudioElement> = {},
): Partial<HTMLAudioElement> {
  return {
    ...DEFAULT_AUDIO_ELEMENT,
    ...overrides,
  };
}

const DEFAULT_AUDIO_CONTEXT = {
  handleSideEffect: vi.fn(),
  audioElementRef: { current: createAudioElement() as HTMLAudioElement },
  timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
  volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
  playbackRateCallbackRef: { current: { handlePlaybackRateAction: vi.fn() } },
};

export function createPointerEvent(
  overrides: Partial<React.PointerEvent<HTMLButtonElement>> = {},
): React.PointerEvent<HTMLButtonElement> {
  return {
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
    ...overrides,
  } as React.PointerEvent<HTMLButtonElement>;
}

export function createAudioContext(
  overrides: Partial<AudioContextType> = {},
): AudioContextType {
  return {
    ...DEFAULT_AUDIO_CONTEXT,
    ...overrides,
  };
}

export function createMockAudioElement(overrides = {}) {
  return {
    currentTime: 10,
    volume: 0.5,
    playbackRate: 1,
    duration: 100,
    ...overrides,
  };
}

type MockProviderProps<T> = {
  children: React.ReactNode;
} & Partial<T>;

export function createMockProvider<T extends object>(
  context: T,
  displayName: string,
): React.FC<MockProviderProps<T>> {
  const MockProvider = ({ children, ...props }: MockProviderProps<T>) => {
    return React.createElement(
      "div",
      {
        "data-testid": `mock-${displayName}`,
        "data-props": JSON.stringify({ ...context, ...props }),
      },
      children,
    );
  };
  MockProvider.displayName = displayName;
  return MockProvider;
}

export const mockProviders = {
  SliderProvider: createMockProvider(createSliderContext(), "SliderProvider"),
  AudioProvider: createMockProvider(createAudioContext(), "AudioProvider"),
} as const;

export const labels = {
  seekForward: "Seek forward by 10 seconds",
  seekBackward: "Seek backward by 10 seconds",
  playAudio: "Play audio",
  pauseAudio: "Pause audio",
  timeline: "Timeline slider",
};
