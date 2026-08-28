import { vi, type Mock } from "vitest";

/**
 * `HTMLAudioElement` declares `duration`, `paused`, `readyState` and `error` as
 * readonly, so the media fields are re-declared writable: a test drives the
 * element by assigning them and then emitting the event the browser would.
 */
export type MediaElementFake = Omit<
  HTMLAudioElement,
  keyof MediaFields | "play" | "pause"
> &
  MediaFields & {
    /**
     * Spies, and typed as such: staging a refused `play()` needs
     * `mockReturnValue`, which `HTMLAudioElement`'s own signature hides.
     */
    play: Mock<() => Promise<void>>;
    pause: Mock<() => void>;
    /** Fires every listener registered for `event`, in registration order. */
    emit: (event: string) => void;
    /** How many listeners are currently registered for `event`. */
    listenerCount: (event: string) => number;
  };

export type MediaFields = {
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  paused: boolean;
  readyState: number;
  error: MediaError | null;
};

const DEFAULTS: MediaFields = {
  currentTime: 0,
  duration: 100,
  volume: 1,
  muted: false,
  playbackRate: 1,
  paused: true,
  // 0 = HAVE_NOTHING, so a bare fake primes to "loading". Tests that want
  // "ready" pass `readyState: 1` (HAVE_METADATA).
  readyState: 0,
  error: null,
};

/**
 * The one media-element fake: plain data properties, `play` / `pause` as spies,
 * and a real listener registry so a sync-layer test can dispatch events without
 * jsdom audio. `readyState` and `error` are here because the two `prime` failure
 * paths are not writable as tests without them.
 */
export function createMediaElementFake(
  overrides: Partial<MediaFields> = {},
): MediaElementFake {
  const listeners = new Map<string, Array<() => void>>();

  const fake = {
    ...DEFAULTS,
    ...overrides,
    dataset: {} as Record<string, string>,
    // Returns a promise, as a real element does — the write path normalises
    // the result anyway, but a test cannot exercise a refusal without one.
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    addEventListener: (event: string, listener: () => void) => {
      const forEvent = listeners.get(event) ?? [];
      forEvent.push(listener);
      listeners.set(event, forEvent);
    },
    removeEventListener: (event: string, listener: () => void) => {
      const forEvent = listeners.get(event);
      if (!forEvent) return;
      const index = forEvent.indexOf(listener);
      if (index !== -1) forEvent.splice(index, 1);
    },
    emit: (event: string) => {
      [...(listeners.get(event) ?? [])].forEach((listener) => listener());
    },
    listenerCount: (event: string) => listeners.get(event)?.length ?? 0,
  };

  return fake as unknown as MediaElementFake;
}
