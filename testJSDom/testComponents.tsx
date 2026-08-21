import { render } from "@testing-library/react";
import {
  AudioContext,
  AudioContextType,
} from "../src/AudioElement/AudioContext";
import { PlayerContextType } from "../src/Player/PlayerContext";
import { PlayerContext } from "../src/Player/PlayerContext";
import { PlayerStoreProvider } from "../src/store/PlayerStoreContext";

type CreateContextWrapperArgs = {
  playerContext: PlayerContextType;
  audioContext: AudioContextType;
};

export function createContextWrapper({
  playerContext,
  audioContext,
}: CreateContextWrapperArgs): React.FC<{ children: React.ReactNode }> {
  return ({ children }: { children: React.ReactNode }) => (
    <PlayerStoreProvider>
      <AudioContext.Provider value={audioContext}>
        <PlayerContext.Provider value={playerContext}>
          {children}
        </PlayerContext.Provider>
      </AudioContext.Provider>
    </PlayerStoreProvider>
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
    <PlayerStoreProvider>
      <AudioContext.Provider value={audioContext}>
        <PlayerContext.Provider value={playerContext}>
          {component}
        </PlayerContext.Provider>
      </AudioContext.Provider>
    </PlayerStoreProvider>,
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
    <PlayerStoreProvider>
      <PlayerContext.Provider value={playerContext}>
        {component}
      </PlayerContext.Provider>
    </PlayerStoreProvider>,
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
    <PlayerStoreProvider>
      <AudioContext.Provider value={audioContext}>
        {component}
      </AudioContext.Provider>
    </PlayerStoreProvider>,
  );
}
