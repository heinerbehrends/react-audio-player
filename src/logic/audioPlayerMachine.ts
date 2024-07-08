import { setup, assign, fromCallback } from "xstate";
import { dragMachine } from "./dragMachine";

export const audioPlayerMachine = setup({
  types: {
    context: {} as {
      audioClip: string;
      position: number;
      ref: null | HTMLAudioElement;
    },
    events: {} as
      | { type: "LOADED"; ref: HTMLAudioElement | null }
      | { type: "TOGGLE_PLAY" }
      | { type: "UPDATE_POSITION" }
      | { type: "SEEK"; time: number }
      | { type: "END_OF_TRACK" },
  },
  actors: {
    updatePosition: fromCallback(({ sendBack }) => {
      sendBack({ type: "UPDATE_POSITION" });
      const interval = setInterval(() => {
        sendBack({ type: "UPDATE_POSITION" });
      }, 50);
      return () => clearInterval(interval);
    }),
    dragMachine,
  },

  actions: {
    togglePlay: ({ context }) => {
      if (!context.ref) {
        return;
      }
      if (context.ref.paused) {
        context.ref.play();
        return;
      }
      context.ref.pause();
    },
  },
}).createMachine({
  id: "audioPlayer",
  initial: "loading",
  context: {
    audioClip: "The-Race.mp3",
    position: 0,
    ref: null,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          actions: assign({
            ref: ({ event }) => event.ref,
          }),
          target: "paused",
        },
      },
    },
    playing: {
      on: {
        TOGGLE_PLAY: { actions: { type: "togglePlay" }, target: "paused" },
        UPDATE_POSITION: {
          actions: assign({
            position: ({ context }) => context.ref?.currentTime ?? 0,
          }),
        },
        END_OF_TRACK: {
          target: "paused",
          actions: assign({
            position: 0,
          }),
        },
        SEEK: {
          actions: [
            assign({
              position: ({ event }) => event.time,
            }),
            ({ context, event }) => {
              if (!context.ref) {
                return;
              }
              context.ref.currentTime = event.time;
            },
          ],
        },
      },
      invoke: [
        {
          src: "updatePosition",
          id: "updatePosition",
        },
        {
          src: "dragMachine",
          id: "dragMachine",
        },
      ],
    },
    paused: {
      on: {
        TOGGLE_PLAY: { actions: { type: "togglePlay" }, target: "playing" },
      },
    },
  },
});
