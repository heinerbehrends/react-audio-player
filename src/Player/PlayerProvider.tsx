import {
  useMemo,
  useReducer,
  memo,
  useContext,
  useCallback,
  useRef,
} from "react";
import {
  PLAYER_DISPATCH_MAP,
  PLAYER_SIDE_EFFECT_MAP,
  initialPlayerState,
  PlayerContext,
  type PlayerContextAction,
  type PlayerProviderAction,
  type PlayerContextType,
  PlayerContextActionType,
  PlayerStateReturnType,
} from "./PlayerContext";
import { playerReducer } from "./playerReducer";
import {
  AudioContext,
  type SideEffectAction,
} from "../AudioElement/AudioContext";

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
  const unmuteVolumeRef = useRef(initialPlayerState.unmuteVolumeRef.current);

  const {
    audioElementRef: { current: audioElement },
    handleSideEffect,
  } = useContext(AudioContext);

  const getPlayerState = useCallback((): PlayerStateReturnType => {
    return {
      duration: audioElement?.duration ?? 0,
      currentTime: audioElement?.currentTime ?? 0,
      volume: audioElement?.volume ?? 1,
      playbackRate: audioElement?.playbackRate ?? 1,
      volumeState: state.volumeState,
      unmuteVolumeRef: unmuteVolumeRef,
    };
  }, [audioElement, state.volumeState]);
  const handlePlayerAction = useCallback(
    (action: PlayerProviderAction) => {
      if (action.type === "SET_UNMUTE_VOLUME") {
        unmuteVolumeRef.current = action.unmuteVolume;
      }
      if (isSideEffectAction(action)) {
        handleSideEffect(action, audioElement);
      }
      if (isPlayerContextAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect],
  );

  const value = useMemo(
    () =>
      ({
        ...state,
        handlePlayerAction,
        getPlayerState,
        unmuteVolumeRef,
      }) satisfies PlayerContextType,
    [state, handlePlayerAction, getPlayerState],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
});

function isSideEffectAction(
  action: PlayerProviderAction,
): action is SideEffectAction {
  return action.type in PLAYER_SIDE_EFFECT_MAP;
}

function isPlayerContextAction(
  action: PlayerProviderAction,
): action is PlayerContextAction {
  return PLAYER_DISPATCH_MAP[action.type as PlayerContextActionType];
}
