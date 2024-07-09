import { setup, assign, fromCallback } from "xstate";
import { dragMachine } from "./dragMachine";

export const audioPlayerMachine = setup({
  types: {
    context: {} as {
      audioClip: string;
      position: number;
      ref: null | HTMLAudioElement;
      dragXOrigin: number;
      dragXOffset: number;
      timelineLeft: number | undefined;
      timelineWidth: number | undefined;
      loop: "on" | "off";
    },
    events: {} as
      | { type: "LOADED"; ref: HTMLAudioElement | null }
      | { type: "TOGGLE_PLAY" }
      | { type: "UPDATE_POSITION" }
      | { type: "SEEK"; time: number }
      | { type: "END_OF_TRACK" }
      | {
          type: "DRAG_START";
          x: number;
          timelineLeft: number | undefined;
          timelineWidth: number | undefined;
        }
      | { type: "DRAG"; x: number }
      | { type: "DRAG_END"; time: number }
      | { type: "TOGGLE_LOOP" },
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
  context: {
    audioClip: "The-Race.mp3",
    position: 0,
    ref: null,
    dragXOffset: 0,
    dragXOrigin: 0,
    timelineLeft: 0,
    timelineWidth: 0,
    loop: "off",
  },
  type: "parallel",
  states: {
    track: {
      initial: "loading",
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
              guard: ({ context }) => {
                if (!context.ref) {
                  return false;
                }
                if (context.loop === "on") {
                  context.ref.currentTime = 0;
                  context.ref.play();
                  return false;
                }
                return true;
              },

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
    },
    drag: {
      initial: "idle",
      states: {
        idle: {
          on: {
            DRAG_START: {
              target: "dragging",
              actions: assign({
                dragXOrigin: ({ event }) => event.x,
                dragXOffset: ({ event }) => event.x,
                timelineLeft: ({ event }) => event.timelineLeft,
                timelineWidth: ({ event }) => event.timelineWidth,
              }),
            },
          },
        },
        dragging: {
          on: {
            DRAG: {
              actions: assign({
                dragXOffset: ({ event }) => event.x,
              }),
            },
            DRAG_END: {
              target: "idle",
              actions: [
                ({ context, event }) => {
                  if (!context.ref) return;
                  context.ref.currentTime = event.time;
                },
                assign({
                  position: ({ event }) => event.time,
                  dragXOffset: 0,
                  dragXOrigin: 0,
                }),
              ],
            },
          },
        },
      },
    },
    loop: {
      initial: "off",
      states: {
        off: {
          on: {
            TOGGLE_LOOP: {
              actions: assign({
                loop: "on",
              }),
              target: "on",
            },
          },
        },
        on: {
          on: {
            TOGGLE_LOOP: {
              actions: assign({
                loop: "off",
              }),
              target: "off",
            },
          },
        },
      },
    },
  },
});
