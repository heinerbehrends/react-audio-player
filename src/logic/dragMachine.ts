import { setup, assign, sendParent } from "xstate";

export const dragMachine = setup({
  types: {
    context: {} as {
      dragXOrigin: number;
      dragXOffset: number;
      timelineLeft: number | undefined;
      timelineWidth: number | undefined;
    },
    events: {} as
      | {
          type: "DRAG_START";
          x: number;
          timelineLeft: number | undefined;
          timelineWidth: number | undefined;
        }
      | { type: "DRAG"; x: number }
      | { type: "DRAG_END"; time: number },
  },
}).createMachine({
  id: "dragMachine",
  initial: "idle",
  context: {
    dragXOffset: 0,
    dragXOrigin: 0,
    timelineLeft: 0,
    timelineWidth: 0,
  },
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
            sendParent(({ context, event }) => {
              console.log("SEEK", context.dragXOffset);
              return {
                type: "SEEK",
                time: event.time,
              };
            }),
            assign({
              dragXOffset: 0,
              dragXOrigin: 0,
            }),
          ],
        },
      },
    },
  },
});
