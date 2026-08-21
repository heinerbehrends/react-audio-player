import {
  createPlayerStore,
  type PlayerStore,
} from "../../src/store/createPlayerStore";
import {
  createMediaElementFake,
  type MediaElementFake,
  type MediaFields,
} from "./mediaElementFake";

export type TestStore = {
  store: PlayerStore;
  /** The attached fake. Assign a field, then `emit` the event a browser would. */
  element: MediaElementFake;
  detach: () => void;
};

/**
 * A store with a fake element already attached, so every atom is primed off the
 * fake's fields. This is the replacement for mocking jsdom audio: a test that
 * wants `loadState: "ready"` passes `readyState: 1`, and one that wants a
 * mid-playback state assigns `element.currentTime` and emits `"timeupdate"`.
 */
export function createTestStore(
  overrides: Partial<MediaFields> = {},
): TestStore {
  const element = createMediaElementFake(overrides);
  const store = createPlayerStore();
  const detach = store.attach(element as unknown as HTMLAudioElement);

  return { store, element, detach };
}
