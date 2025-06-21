import { describe, it, expect } from "vitest";
import { playerReducer } from "../../src/Player/playerReducer";
import { createPlayerContext } from "../testUtils";

describe("playerReducer", () => {
  const playerContext = createPlayerContext();

  describe("AUDIO_FILE_LOADED", () => {
    it("changes state from loading to paused", () => {
      const state = { ...playerContext, playerState: "loading" as const };
      const action = { type: "AUDIO_FILE_LOADED" as const };
      expect(playerReducer(state, action).playerState).toBe("paused");
    });

    it("does not change state if not loading", () => {
      const action = { type: "AUDIO_FILE_LOADED" as const };
      expect(playerReducer(playerContext, action)).toBe(playerContext);
    });
  });

  describe("TOGGLE_PLAY", () => {
    it("toggles from paused to playing", () => {
      const action = { type: "TOGGLE_PLAY" as const };
      expect(playerReducer(playerContext, action).playerState).toBe("playing");
    });

    it("toggles from playing to paused", () => {
      const state = { ...playerContext, playerState: "playing" as const };
      const action = { type: "TOGGLE_PLAY" as const };
      expect(playerReducer(state, action).playerState).toBe("paused");
    });

    it("does not change state if in loading or error state", () => {
      const states = [
        { ...playerContext, playerState: "loading" as const },
        { ...playerContext, playerState: "error" as const },
      ];
      const action = { type: "TOGGLE_PLAY" as const };
      states.forEach((state) => {
        expect(playerReducer(state, action)).toBe(state);
      });
    });
  });

  describe("TOGGLE_MUTE", () => {
    it("toggles mute state and updates volume state", () => {
      const action = {
        type: "TOGGLE_MUTE" as const,
      };
      const newState = playerReducer(playerContext, action);
      expect(newState.isMuted).toBe(true);
      expect(newState.volumeState).toBe("muted");
    });
  });

  describe("SET_PLAYBACK_RATE", () => {
    it("sets playback rate within limits", () => {
      const action = { type: "SET_PLAYBACK_RATE" as const, playbackRate: 2 };
      expect(playerReducer(playerContext, action).playbackRate).toBe(2);
    });

    it("clamps playback rate to minimum", () => {
      const action = { type: "SET_PLAYBACK_RATE" as const, playbackRate: 0.1 };
      expect(playerReducer(playerContext, action).playbackRate).toBe(0.5);
    });

    it("clamps playback rate to maximum", () => {
      const action = { type: "SET_PLAYBACK_RATE" as const, playbackRate: 5 };
      expect(playerReducer(playerContext, action).playbackRate).toBe(4);
    });
  });

  describe("AUDIO_FILE_ENDED", () => {
    it("sets state to paused", () => {
      const state = { ...playerContext, playerState: "playing" as const };
      const action = { type: "AUDIO_FILE_ENDED" as const };
      expect(playerReducer(state, action).playerState).toBe("paused");
    });
  });

  describe("TOGGLE_TIME_DISPLAY", () => {
    it("toggles between elapsed and remaining", () => {
      const action = { type: "TOGGLE_TIME_DISPLAY" as const };
      expect(playerReducer(playerContext, action).timeDisplay).toBe(
        "remaining",
      );
      expect(
        playerReducer(
          { ...playerContext, timeDisplay: "remaining" as const },
          action,
        ).timeDisplay,
      ).toBe("elapsed");
    });
  });

  describe("TOGGLE_CAPTIONS", () => {
    it("toggles captions visibility", () => {
      const action = { type: "TOGGLE_CAPTIONS" as const };
      expect(playerReducer(playerContext, action).showCaptions).toBe(true);
      expect(
        playerReducer({ ...playerContext, showCaptions: true }, action)
          .showCaptions,
      ).toBe(false);
    });
  });

  describe("AUDIO_FILE_ERROR", () => {
    it("sets state to error", () => {
      const action = { type: "AUDIO_FILE_ERROR" as const };
      expect(playerReducer(playerContext, action).playerState).toBe("error");
    });
  });

  describe("CAPTION_CUE_CHANGE", () => {
    it("updates cues", () => {
      const cues = [{ text: "test" }] as VTTCue[];
      const action = { type: "CAPTION_CUE_CHANGE" as const, cues };
      expect(playerReducer(playerContext, action).cues).toBe(cues);
    });
  });

  describe("SET_VOLUME_STATE", () => {
    it("updates volume state", () => {
      const action = {
        type: "SET_VOLUME_STATE" as const,
        volumeState: "low" as const,
      };
      expect(playerReducer(playerContext, action).volumeState).toBe("low");
    });
    it("updates isMuted to true if volumeState is muted", () => {
      const action = {
        type: "SET_VOLUME_STATE" as const,
        volumeState: "muted" as const,
      };
      expect(playerReducer(playerContext, action).isMuted).toBe(true);
    });
    it("updates isMuted to false if volumeState is not muted", () => {
      const action = {
        type: "SET_VOLUME_STATE" as const,
        volumeState: "low" as const,
      };
      expect(playerReducer(playerContext, action).isMuted).toBe(false);
    });
  });

  describe("UNMUTE", () => {
    it("unmutes if currently muted", () => {
      const state = { ...playerContext, isMuted: true };
      const action = { type: "UNMUTE" as const };
      expect(playerReducer(state, action).isMuted).toBe(false);
    });

    it("does nothing if not muted", () => {
      const action = { type: "UNMUTE" as const };
      expect(playerReducer(playerContext, action)).toStrictEqual(playerContext);
    });
  });

  describe("PAUSE", () => {
    it("sets state to paused", () => {
      const state = { ...playerContext, playerState: "playing" as const };
      const action = { type: "PAUSE" as const };
      expect(playerReducer(state, action).playerState).toBe("paused");
    });
  });
});
