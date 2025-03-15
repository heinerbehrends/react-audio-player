import { useMemo, useReducer, memo, useCallback, useContext } from "react";
import {
  VolumeContext,
  initialState,
  VolumeContextAction,
} from "./VolumeContext";
import { volumeReducer } from "./volumeReducer";
import { AudioContext, SideEffectAction } from "../AudioElement/AudioContext";

type VolumeProviderProps = {
  children: React.ReactNode;
};

export type VolumeProviderAction = SideEffectAction | VolumeContextAction;

// Extract action types for better type safety
type SideEffectActionType = SideEffectAction["type"];
type VolumeActionType = VolumeContextAction["type"];

// Define actions that need side effects
const VOLUME_SIDE_EFFECT_MAP: Record<SideEffectActionType, true> = {
  DRAG: true,
  DRAG_END: true,
  SEEK_TO_TIME: true,
  TOGGLE_PLAY: true,
  TOGGLE_MUTE: true,
  AUDIO_FILE_ENDED: true,
};

const VOLUME_DISPATCH_MAP: Record<VolumeActionType, true> = {
  TIMELINE_LOADED: true,
  DRAG_START: true,
  DRAG: true,
  DRAG_END: true,
  UPDATE_TIME: true,
  SEEK_TO_TIME: true,
};

function isVolumeSideEffect(
  action: VolumeProviderAction
): action is SideEffectAction {
  return VOLUME_SIDE_EFFECT_MAP[action.type as SideEffectActionType] === true;
}

function isVolumeAction(
  action: VolumeProviderAction
): action is VolumeContextAction {
  return VOLUME_DISPATCH_MAP[action.type as VolumeActionType] === true;
}

export const VolumeProvider = memo(function VolumeProvider({
  children,
}: VolumeProviderProps) {
  const [state, dispatch] = useReducer(volumeReducer, initialState);
  const { audioElement, handleSideEffect } = useContext(AudioContext);

  // Handle both dispatch and side effects in one function
  const handleTimelineAction = useCallback(
    (action: VolumeProviderAction) => {
      // Handle side effects if needed
      if (isVolumeSideEffect(action)) {
        handleSideEffect(action, audioElement);
      }

      if (isVolumeAction(action)) {
        dispatch(action);
      }
    },
    [audioElement, handleSideEffect]
  );

  const value = useMemo(
    () => ({ ...state, handleTimelineAction }),
    [state, handleTimelineAction]
  );

  return (
    <VolumeContext.Provider value={value}>{children}</VolumeContext.Provider>
  );
});
