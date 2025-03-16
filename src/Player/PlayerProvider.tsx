import { useMemo, useReducer, memo, useContext, useCallback } from "react";
import {
  PlayerContext,
  PlayerContextAction,
  initialState,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import { AudioContext, SideEffectAction } from "../AudioElement/AudioContext";

type PlayerContextProviderProps = {
  children: React.ReactNode;
  audioFiles: { src: string; captionSrc?: string }[];
};

type SideEffectActionType = SideEffectAction["type"];
type PlayerContextActionType = PlayerContextAction["type"];

export type PlayerProviderAction = SideEffectAction | PlayerContextAction;

const PLAYER_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  SEEK_TO_TIME: true,
  AUDIO_FILE_ENDED: true,
  DRAG: true,
  DRAG_END: true,
};

const PLAYER_DISPATCH_MAP: Record<PlayerContextActionType, true> = {
  AUDIO_FILE_LOADED: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  TOGGLE_TIME_DISPLAY: true,
  AUDIO_FILE_ENDED: true,
  AUDIO_FILE_ERROR: true,
  CAPTION_CUE_CHANGE: true,
};

// Type-safe version of the check functions
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

export const PlayerContextProvider = memo(function PlayerContextProvider({
  children,
  audioFiles,
}: PlayerContextProviderProps) {
  const [state, dispatch] = useReducer(playerReducer, {
    ...initialState,
    audioFiles,
  });
  const { audioElement, handleSideEffect } = useContext(AudioContext);

  console.log("handleSideEffect", handleSideEffect);
  const handlePlayerAction = useCallback(
    (action: PlayerProviderAction) => {
      if (isSideEffectAction(action)) {
        console.log("handlePlayerAction action", action);
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
