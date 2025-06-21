import { useMemo, useReducer, memo, useContext, useCallback } from "react";
import {
  initialPlayerState,
  PlayerContext,
  type PlayerContextAction,
  type PlayerContextType,
  type PlayerStateReturnType,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import { AudioContext } from "../AudioElement/AudioContext";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: AudioFile[];
};

export type AudioFile = {
  src: string;
  captionSrc?: string;
};

export const PlayerContextProvider = memo(function PlayerContextProvider({
  children,
  audioFiles,
}: PlayerContextProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialPlayerState,
    audioFiles,
  });

  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  const getPlayerState = useCallback((): PlayerStateReturnType => {
    return {
      duration: audioElement?.duration ?? 0,
      currentTime: audioElement?.currentTime ?? 0,
      volume: audioElement?.volume ?? 1,
      playbackRate: audioElement?.playbackRate ?? 1,
      volumeState: state.volumeState,
    };
  }, [audioElement, state.volumeState]);
  const handlePlayerAction = useCallback(
    (action: PlayerContextAction) => {
      dispatch(action);
    },
    [dispatch],
  );

  const value = useMemo(
    () =>
      ({
        ...state,
        handlePlayerAction,
        getPlayerState,
      }) satisfies PlayerContextType,
    [state, handlePlayerAction, getPlayerState],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});
