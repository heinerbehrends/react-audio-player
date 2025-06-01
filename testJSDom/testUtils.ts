import { type SliderContext } from "../src/Slider/SliderContext";
import { type AudioContextType } from "../src/AudioElement/AudioContext";
import { vi } from "vitest";

// Default values for slider context
const DEFAULT_SLIDER_CONTEXT = {
  value: 0.5,
  minValue: 0,
  maxValue: 1,
  step: 0.1,
  orientation: "horizontal" as const,
  sliderLength: 100,
  sliderStart: 0,
  clientXY: 50,
  dragState: "idle" as const,
  component: "timeline" as const,
  offsetFromMiddle: 0,
};

// Default values for player context
const DEFAULT_PLAYER_CONTEXT = {
  playerState: "paused" as const,
  showCaptions: false,
  isMuted: false,
  isPlaying: false,
  playbackRate: 1,
  volumeState: "high" as const,
  timeDisplay: "elapsed" as const,
  audioFiles: [] as AudioFile[],
  cues: [],
  unmuteVolumeRef: { current: 0 },
  getPlayerState: () => ({
    handlePlayerAction: vi.fn(),
    playerState: "high" as const,
    showCaptions: false,
    isMuted: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.5,
    playbackRate: 1,
    volumeState: "high" as const,
    unmuteVolumeRef: { current: 0 },
  }),
};

// Default values for audio context
const DEFAULT_AUDIO_CONTEXT = {
  audioElementRef: { current: null },
  handleSideEffect: vi.fn(),
  timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
  volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
  playbackRateCallbackRef: { current: { handlePlaybackRateAction: vi.fn() } },
};
/**
 * Creates a slider context with optional overrides
 */
export function createSliderContext(
  overrides: Partial<SliderContext> = {},
): SliderContext {
  return {
    ...DEFAULT_SLIDER_CONTEXT,
    handleSliderAction: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a player context with optional overrides
 */
export function createPlayerContext({
  overrides = {},
  getPlayerStateOverrides = {},
}: {
  overrides?: Partial<typeof DEFAULT_PLAYER_CONTEXT>;
  getPlayerStateOverrides?: Partial<
    (typeof DEFAULT_PLAYER_CONTEXT)["getPlayerState"]
  >;
} = {}) {
  const handlePlayerAction = vi.fn();
  return {
    ...DEFAULT_PLAYER_CONTEXT,
    handlePlayerAction,
    getPlayerState: () => ({
      ...DEFAULT_PLAYER_CONTEXT.getPlayerState(),
      handlePlayerAction,
      ...getPlayerStateOverrides,
    }),
    ...overrides,
  };
}

/**
 * Creates a mock pointer event with optional overrides
 */
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

/**
 * Creates an audio context with optional overrides
 */
export function createAudioContext(
  overrides: Partial<AudioContextType> = {},
): AudioContextType {
  return {
    ...DEFAULT_AUDIO_CONTEXT,
    ...overrides,
  };
}

/**
 * Creates a mock audio element with optional overrides
 */
export function createMockAudioElement(overrides = {}) {
  return {
    currentTime: 10,
    volume: 0.5,
    playbackRate: 1,
    duration: 100,
    ...overrides,
  };
}

type AudioFile = {
  src: string;
  captionSrc?: string;
};
