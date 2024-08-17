import { setup, assign, fromCallback } from "xstate";

type DragElement = "loopStart" | "loopEnd" | "timeline";
export type Context = {
  audioClip: string;
  position: number;
  ref: null | HTMLAudioElement;
  dragXOffset: number;
  dragElement: DragElement;
  timelineLeft: number | undefined;
  timelineWidth: number | undefined;
  loop: "on" | "off";
  loopMarkerStart: number;
  loopMarkerEnd: number;
};
export const audioPlayerMachine = setup({
  types: {
    context: {} as Context,
    events: {} as
      | { type: "LOADED"; ref: HTMLAudioElement | null }
      | { type: "TIMELINE_LOADED"; timelineLeft: number; timelineWidth: number }
      | { type: "TOGGLE_PLAY" }
      | { type: "UPDATE_POSITION" }
      | { type: "SEEK"; time: number }
      | { type: "END_OF_TRACK" }
      | {
          type: "DRAG_START";
          x: number;
          element: DragElement;
        }
      | {
          type: "DRAG";
          x: number;
        }
      | {
          type: "DRAG_END";
          time: number;
        }
      | { type: "TOGGLE_LOOP" }
      | { type: "SET_LOOP_START" }
      | { type: "SET_LOOP_END" },
  },
  actors: {
    updatePosition: fromCallback(({ sendBack }) => {
      sendBack({ type: "UPDATE_POSITION" });
      const interval = setInterval(() => {
        sendBack({ type: "UPDATE_POSITION" });
      }, 50);
      return () => clearInterval(interval);
    }),
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
  /** @xstate-layout N4IgpgJg5mDOIC5QEMCuECWB7ACgG2QE8wAnAOgBcTkBjAazLy2UwDsoBiAGQHkBBACIBRAQG0ADAF1EoAA5ZYGCtlYyQAD0QAWcQA4yARgCc4gKwAmAOzGdWgMymANCELat+o5YBsxr34NaWqaBAL4hzmiYuATE5FS0DLIxGOwcACo8AOKZXEIA+jhcfACaEtJIIPKKyliqFZoIOvrGZlY24vZOLohelkZkduIO3kFGRjoGYRHo2PhEpJTU9GRJRCmcAKo4Anxp+Tg8AMoAkmnHPAByZWpVSipqDQZ2XgN2RnYGXua6uj6Wes5XAgvKZxGQTFpLLohroDKZTD8piBIrMYgt4stVoR1hwhBcBHkeAAxPJpABKfAAwgBpa4VW41OqgBpNQwmCzWcYdByAxCWSx2Mi6Iw-cT83QWcR+JEo6LzOJLRLJVKHIRCWlSG4KO61B6IAy6QXmcxfAJaXpwwK8hCmQZkcTmOywuzuKUBSbhZEzOWxRYJFZoWCQdJZHL7IqlTX07WMvWNCVCuxJgUgrTfax2a0IrRkf6GoJPc0Cywy71zX0QahQNIYAC2YDwKTAZAwEDwYHSxwAskIuMcLvleIIRHS5DH7vU+QZwWNZ3PZ5ZrQZxE8yKDTONBuZxB1LFpS1FywtK8hq3WG02W22OwIKZk8oc0nwyWlR5Vx7rJwgrGCfCYjF4BZGBYRhLuIIpkF4zxGNue7-FKugHqi8pkCeZ71o2rDNmhUA4refCZG+DITsyiCgpYhhQoBHRmgY3xgeYOZ6O8QwwVCTpIT6x5VjWGGXjheF3nkeJiFGY7VCRGiIA4gq6OYASeNYkJeA6XjWopubwsBTrmlK8mcUe5BoVwWBYLIhwUMgJAUFe7YcPh96Ps+r5ie+EmfqRCAGAK4IWDowyeNuXi6NajGmIYLSgipZgmCuBlokZVYmWZFlWTZAmpA5REfkyUmNMua4GDYljBPJ0KLt0Xn-GuSlPE6nh0Qa8UocZpnmZZ1moVWuGZUJInZe5uUNOYpgUZa0LuGmFjQl0QJwmCFhOsYVi2o6FjNRWSVtUIrAQLZN5CU5L4DTqQ36j5wGMUMo2BQhS5vBRzHmCKdV0UYG3caeyWyDte0ZZwWWucRHl5VoBWmEV4wlWmBpivdxprmDfjgcaI1FR9iVfdtu1daePUA31+InbGX4jWNwQTboU3fGY90OmQWhcn45W-CNGOMG1ZBYAAZtzIbZLkeS8DwODE5JjwXX5119JYQUhZVnzAYjnwlRDMEQ+zTBmVzrD82GQs8CLYsgxLgqXf5N2y3dCvReC5qBGD7wikEYSeqwWAQHAaiyoZWqDXGAC0jH2juodh6HmaVUHTHh7HO4lp6PsJX69B+6dcbPdazzTkp3zLQiphQQn0yHsnGIMEwLDrGnJOed84UQn0jNWOmugVUCkLTotsJFb0wRJuz5crMqUA1+LfLt3yoJrqHRX-MFI12IPioBqgQYQGPJs9L0iYuo15q9CK1peGMM+NZKkKwohidlsnaG8ReWGb2d35m-O7+eNawpgoz-lGEVu4Pjs3vueTCzZWztmfnGOi5hd4ukAtnT4BglxFUFMuOe9gggfH3DfUuLUeKgP4t1au0Z-ZfkZv0EUsIoIQwdGxLQKDHSQSpraCwtplwu1wchTaWMUodQoFA0mDDKpQTICaFoWDPAugPsArafC0r7UEZ5WWoUNxrkNIMR2PwGqyN4e1BR-0lGgyGAMeSkIpROilGYSOQIfyGD8IBTujMqI4JLtwz6UBvq-SMcNYRc15LhUdAE2CxoBSmF0Z47Ge0IFgB8XycwS4wZd1YRDAUARngRK8TjQxpD07kJMXYMx89LEqVtIkhGTxgowUYiVbyXhNZtTid+Px+oIaCmCkEZ6QRDTAVcV6PBvotayC5rzJpKibbPXtPyOwUI5KBGCPUrhXFyBDJ1k0l0-Q5IBELvJKwvQhhLigl3fkOgVKFh3DgsIQA */
  id: "audioPlayer",
  context: {
    audioClip: "The-Race.mp3",
    position: 0,
    ref: null,
    dragXOffset: 0,
    timelineLeft: 0,
    timelineWidth: 0,
    loop: "off",
    loopMarkerStart: 0,
    loopMarkerEnd: 0,
    dragElement: "timeline",
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
                loopMarkerEnd: ({ event }) => event.ref?.duration ?? 0,
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
          ],
        },
        paused: {
          on: {
            TOGGLE_PLAY: { actions: { type: "togglePlay" }, target: "playing" },
          },
        },
      },
    },
    dragTimeline: {
      initial: "idle",
      states: {
        idle: {
          on: {
            TIMELINE_LOADED: {
              actions: assign({
                timelineLeft: ({ event }) => event.timelineLeft,
                dragXOffset: ({ event }) => event.timelineLeft,
                timelineWidth: ({ event }) => event.timelineWidth,
              }),
            },
            DRAG_START: {
              guard: ({ event }) => {
                return event.element === "timeline";
              },
              target: "dragging",
              actions: assign({
                dragXOffset: ({ event }) => event.x,
              }),
            },
          },
        },
        dragging: {
          on: {
            DRAG: {
              actions: assign({
                dragXOffset: ({ event, context }) => {
                  console.log('dragging', event.x);
                  if (context.timelineWidth === undefined) {
                    console.error("timelineWidth is undefined");
                    return 0;
                  }
                  if (event.x < (context.timelineLeft ?? 0)) {
                    console.log(event.x);
                    return context.timelineLeft ?? 0;
                  }
                  return event.x;
                },
              }),
            },
            DRAG_END: {
              target: "idle",
              actions: [
                ({ context, event }) => {
                  console.log('drag end', event.time);
                  if (!context.ref) return;
                  context.ref.currentTime = event.time;
                },
                assign({
                  position: ({ event }) => event.time,
                  dragXOffset: ({context}) => context.timelineLeft ?? 0,
                }),
              ],
            },
          },
        },
      },
    },
    dragLoopStart: {
      initial: "idle",
      states: {
        idle: {
          on: {
            DRAG_START: {
              guard: ({ event }) => {
                return event.element === "loopStart";
              },
              target: "dragging",
              actions: assign({
                dragElement: "loopStart",
              }),
            },
            SET_LOOP_START: {
              actions: assign({
                loopMarkerStart: ({ context }) => {
                  return context?.ref?.currentTime ?? 0;
                },
              }),
            },
            SET_LOOP_END: {
              actions: assign({
                loopMarkerEnd: ({ context }) => {
                  return context?.ref?.currentTime ?? 0;
                },
              }),
            },
          },
        },
        dragging: {
          on: {
            DRAG: {
              actions: assign({
                dragXOffset: ({ event }) => event.x,
                dragElement: "loopEnd",
              }),
            },
            DRAG_END: {
              target: "idle",
              actions: assign({
                loopMarkerStart: ({ event }) => event.time,
              }),
            },
          },
        },
      },
    },
    dragLoopEnd: {
      initial: "idle",
      states: {
        idle: {
          on: {
            DRAG_START: {
              guard: ({ event }) => {
                return event.element === "loopEnd";
              },
              target: "dragging",
              actions: assign({
                dragXOffset: ({ event }) => event.x,
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
              actions: assign({
                loopMarkerEnd: ({ event }) => event.time,
              }),
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
          always: {
            target: "on",
            guard: ({
              context: { loopMarkerEnd, timelineWidth = 1, ref },
            }: {
              context: Context;
            }) => {
              if (!ref) {
                return false;
              }
              const relativeTimeEnd = getRelativeTime({
                loopMarkerPosition: loopMarkerEnd,
                timelineWidth,
                duration: ref.duration,
              });
              return ref.currentTime >= relativeTimeEnd;
            },
            actions: ({
              context: { loopMarkerStart = 0, ref, timelineWidth = 1 },
            }: {
              context: Context;
            }) => {
              if (!ref) {
                return;
              }
              const relativeTimeStart = getRelativeTime({
                loopMarkerPosition: loopMarkerStart,
                timelineWidth,
                duration: ref.duration,
              });
              ref.currentTime = relativeTimeStart;
            },
          },
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

type GetRelativeTimeArgs = {
  loopMarkerPosition: number;
  timelineWidth: number | undefined;
  duration: number;
};

function getRelativeTime({
  loopMarkerPosition,
  timelineWidth = 1,
  duration,
}: GetRelativeTimeArgs) {
  const relativePosition = loopMarkerPosition / timelineWidth;
  return relativePosition * duration;
}
