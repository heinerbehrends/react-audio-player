import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { act } from "@testing-library/react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import type { Shortcuts } from "../../src/KeyboardControls/handleMediaKeys";
import type { Track } from "../../src/Player/PlayerConfigContext";
import type { PlayerLabels } from "../../src/Shared/playerLabels";
import { createTestStore, type TestStore } from "./createTestStore";
import type { MediaFields } from "./mediaElementFake";

type RenderWithStoreOptions = Omit<RenderOptions, "wrapper"> & {
  /** An existing harness, when a test needs the store before it renders. */
  testStore?: TestStore | undefined;
  /** Otherwise: the element fields to prime from. */
  element?: Partial<MediaFields> | undefined;
  track?: Track | undefined;
  shortcuts?: Shortcuts | undefined;
  labels?: PlayerLabels | undefined;
};

export type RenderWithStoreResult = RenderResult &
  TestStore & {
    /** Emits a media event on the fake inside `act`, so React flushes. */
    emit: (event: string) => void;
  };

const defaultTrack: Track = { src: "test-audio.mp3" };

/**
 * Mounts a component against a store and the static config, instead of a full
 * `<AudioPlayer>`. Nothing here renders an `<audio>` tag, so no test needs jsdom
 * audio to reach a player state.
 */
export function renderWithStore(
  ui: React.ReactElement,
  {
    testStore,
    element,
    track = defaultTrack,
    shortcuts,
    labels,
    ...renderOptions
  }: RenderWithStoreOptions = {},
): RenderWithStoreResult {
  // `readyState: 1` by default: a loaded, paused player is what most component
  // tests mean by "no particular state".
  const harness = testStore ?? createTestStore({ readyState: 1, ...element });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerStoreProvider store={harness.store}>
      <PlayerConfigProvider track={track} shortcuts={shortcuts} labels={labels}>
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    ...harness,
    emit: (event: string) => act(() => harness.element.emit(event)),
  };
}
