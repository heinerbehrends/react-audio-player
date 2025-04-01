import type { PlayerContextAction, PlayerContextType } from "./PlayerContext";

export function playerReducer(
  state: PlayerContextType,
  action: PlayerContextAction
) {
  switch (action.type) {
    case "AUDIO_FILE_LOADED": {
      if (state.player === "loading") {
        return { ...state, player: "paused" as const };
      }
      return state;
    }
    case "TOGGLE_PLAY": {
      if (state.player === "playing") {
        return { ...state, player: "paused" as const };
      }
      if (state.player === "paused") {
        return { ...state, player: "playing" as const };
      }
      return state;
    }
    case "TOGGLE_MUTE": {
      const newVolumeState = state.isMuted ? state.volumeState : "muted";
      return { ...state, isMuted: !state.isMuted, volumeState: newVolumeState };
    }
    case "SET_PLAYBACK_RATE": {
      return { ...state, playbackRate: action.playbackRate };
    }
    case "AUDIO_FILE_ENDED": {
      return { ...state, player: "paused" as const, time: 0 };
    }
    case "TOGGLE_TIME_DISPLAY": {
      return {
        ...state,
        timeDisplay:
          state.timeDisplay === "elapsed"
            ? ("remaining" as const)
            : ("elapsed" as const),
      };
    }
    case "AUDIO_FILE_ERROR": {
      return { ...state, player: "error" as const };
    }
    case "CAPTION_CUE_CHANGE": {
      return { ...state, cues: action.cues as VTTCue[] };
    }
    case "SET_VOLUME_STATE": {
      return { ...state, volumeState: action.volumeState };
    }
    case "UNMUTE": {
      if (!state.isMuted) return state;
      return { ...state, isMuted: false };
    }
  }
}
