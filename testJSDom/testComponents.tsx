import { render } from "@testing-library/react";
import {
  AudioContext,
  AudioContextType,
} from "../src/AudioElement/AudioContext";
import { PlayerContextType } from "../src/Player/PlayerContext";

import { PlayerContext } from "../src/Player/PlayerContext";

export function createContextWrapper({
  audioContext,
  playerContext,
}: {
  audioContext: AudioContextType;
  playerContext: PlayerContextType;
}) {
  return ({ children }: { children: React.ReactNode }) => (
    <PlayerContext.Provider value={playerContext}>
      <AudioContext.Provider value={audioContext}>
        {children}
      </AudioContext.Provider>
    </PlayerContext.Provider>
  );
}

export function renderWithContexts({
  playerContext,
  audioContext,
  children,
}: {
  playerContext: PlayerContextType;
  audioContext: AudioContextType;
  children: React.ReactNode;
}) {
  return render(
    <PlayerContext.Provider value={playerContext}>
      <AudioContext.Provider value={audioContext}>
        {children}
      </AudioContext.Provider>
    </PlayerContext.Provider>,
  );
}
