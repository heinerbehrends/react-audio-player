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
      switch (state.playerState) {
        case "playing": {
          return {
            ...state,
            playerState: "paused" as const,
          };
        }
        case "paused": {
          return {
            ...state,
            playerState: "playing" as const,
          };
        }
        default: {
          return state;
        }
      }
    }
    case "TOGGLE_MUTE": {
      const newVolumeState = state.isMuted ? state.volumeState : "muted";
      return {
        ...state,
        isMuted: !state.isMuted,
        volumeState: newVolumeState,
      };
    }
    case "UNMUTE": {
      return { ...state, isMuted: false };
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
    case "PAUSE": {
      return { ...state, playerState: "paused" as const };
    }
    case "SET_PLAYBACK_RATE": {
      const restrictedPlaybackRate = Math.max(
        Math.min(action.playbackRate, 4),
        0.5,
      );
      return {
        ...state,
        playbackRate: restrictedPlaybackRate,
      };
    }
    case "SET_DURATION": {
      return {
        ...state,
        duration: action.duration,
      };
    }
    default: {
      return state;
    }
  }
}
