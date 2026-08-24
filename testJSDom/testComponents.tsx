import { render } from "@testing-library/react";
import { useState } from "react";
import {
  AudioContext,
  AudioContextType,
} from "../src/AudioElement/AudioContext";
import { PlayerContextType } from "../src/Player/PlayerContext";
import { PlayerContext } from "../src/Player/PlayerContext";
import { PlayerStoreProvider } from "../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../src/Player/PlayerConfigContext";
import type { KeyToActionMap } from "../src/KeyboardControls/handleMediaKeys";
import type { AudioFile } from "../src/Player/PlayerConfigContext";
import { createTestStore } from "./store/createTestStore";
import type { MediaFields } from "./store/mediaElementFake";

type TestProvidersProps = {
  children: React.ReactNode;
  audioFiles?: AudioFile[];
  customKeyboardShortcuts?: KeyToActionMap | undefined;
  /** Fields the attached fake is primed from. */
  element?: Partial<MediaFields>;
};

/**
 * The store and the static config, which every component needs now that the
 * derivations read atoms and `useHandleMediaKeys` reads
 * `customKeyboardShortcuts` from `PlayerConfigContext`.
 *
 * The store comes with a fake attached at `readyState: 1`, so the default is a
 * loaded, paused player — what `createPlayerContext`'s default described.
 */
export function TestProviders({
  children,
  audioFiles = [],
  customKeyboardShortcuts,
  element,
}: TestProvidersProps) {
  const [harness] = useState(() =>
    createTestStore({ readyState: 1, ...element }),
  );

  return (
    <PlayerStoreProvider store={harness.store}>
      <PlayerConfigProvider
        audioFiles={audioFiles}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}

type CreateContextWrapperArgs = {
  playerContext: PlayerContextType;
  audioContext: AudioContextType;
};

export function createContextWrapper({
  playerContext,
  audioContext,
}: CreateContextWrapperArgs): React.FC<{ children: React.ReactNode }> {
  return ({ children }: { children: React.ReactNode }) => (
    <TestProviders
      audioFiles={playerContext.audioFiles}
      customKeyboardShortcuts={playerContext.customKeyboardShortcuts}
    >
      <AudioContext.Provider value={audioContext}>
        <PlayerContext.Provider value={playerContext}>
          {children}
        </PlayerContext.Provider>
      </AudioContext.Provider>
    </TestProviders>
  );
}

export function renderWithContexts({
  playerContext,
  audioContext,
  component,
}: {
  playerContext: PlayerContextType;
  audioContext: AudioContextType;
  component: React.ReactNode;
}) {
  return render(
    <TestProviders
      audioFiles={playerContext.audioFiles}
      customKeyboardShortcuts={playerContext.customKeyboardShortcuts}
    >
      <AudioContext.Provider value={audioContext}>
        <PlayerContext.Provider value={playerContext}>
          {component}
        </PlayerContext.Provider>
      </AudioContext.Provider>
    </TestProviders>,
  );
}

export function renderWithPlayerContext({
  playerContext,
  component,
}: {
  playerContext: PlayerContextType;
  component: React.ReactNode;
}) {
  return render(
    <TestProviders
      audioFiles={playerContext.audioFiles}
      customKeyboardShortcuts={playerContext.customKeyboardShortcuts}
    >
      <PlayerContext.Provider value={playerContext}>
        {component}
      </PlayerContext.Provider>
    </TestProviders>,
  );
}

export function renderWithAudioContext({
  audioContext,
  component,
}: {
  audioContext: AudioContextType;
  component: React.ReactNode;
}) {
  return render(
    <TestProviders>
      <AudioContext.Provider value={audioContext}>
        {component}
      </AudioContext.Provider>
    </TestProviders>,
  );
}
