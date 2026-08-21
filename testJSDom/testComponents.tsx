import { render } from "@testing-library/react";
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

type TestProvidersProps = {
  children: React.ReactNode;
  audioFiles?: AudioFile[];
  customKeyboardShortcuts?: KeyToActionMap | undefined;
};

/**
 * The store and the static config, which every component needs now that
 * `useHandleMediaKeys` reads `customKeyboardShortcuts` from `PlayerConfigContext`
 * rather than from the reducer.
 */
export function TestProviders({
  children,
  audioFiles = [],
  customKeyboardShortcuts,
}: TestProvidersProps) {
  return (
    <PlayerStoreProvider>
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
