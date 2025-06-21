import type { PlayerContextAction, PlayerContextType } from "./PlayerContext";

export function playerReducer(
  state: PlayerContextType,
  action: PlayerContextAction,
): PlayerContextType {
  switch (action.type) {
    case "AUDIO_FILE_LOADED": {
      if (state.playerState === "loading") {
        return {
          ...state,
          playerState: "paused" as const,
        };
      }
      return state;
    }

    case "TOGGLE_PLAY": {
      if (state.playerState === "playing") {
        return {
          ...state,
          playerState: "paused" as const,
        };
      }
      if (state.playerState === "paused") {
        return {
          ...state,
          playerState: "playing" as const,
        };
      }
      return state;
    }

    case "TOGGLE_MUTE": {
      const newVolumeState = state.isMuted ? state.volumeState : "muted";
      return {
        ...state,
        isMuted: !state.isMuted,
        volumeState: newVolumeState,
      };
    }

    case "SET_PLAYBACK_RATE": {
      const limitedRate = Math.min(Math.max(action.playbackRate, 0.5), 4);
      return {
        ...state,
        playbackRate: limitedRate,
      };
    }

    case "AUDIO_FILE_ENDED": {
      return {
        ...state,
        playerState: "paused" as const,
      };
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

    case "TOGGLE_CAPTIONS": {
      return {
        ...state,
        showCaptions: !state.showCaptions,
      };
    }

    case "AUDIO_FILE_ERROR": {
      return { ...state, playerState: "error" as const };
    }

    case "CAPTION_CUE_CHANGE": {
      return {
        ...state,
        cues: action.cues as VTTCue[],
      };
    }

    case "SET_VOLUME_STATE": {
      if (action.volumeState === "muted") {
        return {
          ...state,
          isMuted: true,
          volumeState: action.volumeState,
        };
      }
      return {
        ...state,
        isMuted: false,
        volumeState: action.volumeState,
      };
    }

    case "UNMUTE": {
      if (!state.isMuted) return state;
      return { ...state, isMuted: false };
    }

    case "PAUSE": {
      return { ...state, playerState: "paused" as const };
    }

    default: {
      return state;
    }
  }
}
