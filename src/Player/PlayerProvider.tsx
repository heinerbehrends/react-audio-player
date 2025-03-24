import { useMemo, useReducer, memo, useContext, useCallback } from "react";
import {
  PLAYER_DISPATCH_MAP,
  PLAYER_SIDE_EFFECT_MAP,
  initialState,
  PlayerContext,
  type PlayerContextAction,
  type PlayerProviderAction,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import {
  AudioContext,
  type SideEffectAction,
} from "../AudioElement/AudioContext";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: { src: string; captionSrc?: string }[];
};

export const PlayerContextProvider = memo(function PlayerContextProvider({
  children,
  audioFiles,
}: PlayerContextProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialState,
    audioFiles,
  });
  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
  } = useContext(AudioContext);

  const handlePlayerAction = useCallback(
    (action: PlayerProviderAction) => {
      if (isSideEffectAction(action)) {
        handleSideEffect(action, audioElement);
      }
      if (isPlayerContextAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect]
  );

  const value = useMemo(
    () => ({ ...state, handlePlayerAction }),
    [state, handlePlayerAction]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});

function isSideEffectAction(
  action: PlayerProviderAction
): action is SideEffectAction {
  return action.type in PLAYER_SIDE_EFFECT_MAP;
}

function isPlayerContextAction(
  action: PlayerProviderAction
): action is PlayerContextAction {
  return action.type in PLAYER_DISPATCH_MAP;
}
