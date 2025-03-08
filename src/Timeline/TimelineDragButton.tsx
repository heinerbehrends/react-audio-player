import { handleTimelineKeys } from "./handleTimelineKeys";
import { useContext, type HTMLAttributes } from "react";
import { useDrag } from "../useDrag";
import { TimelineContext } from "./TimelineContext";
import { PlayerContext } from "../Player/PlayerContext";

export function TimelineDragButton(props: HTMLAttributes<HTMLButtonElement>) {
  const { xOffset, dragState, timelineWidth, time, dispatch } =
    useContext(TimelineContext);
  const { element, dispatch: dispatchPlayer } = useContext(PlayerContext);
  const progress = time / (element?.duration ?? 0);
  const offset = dragState === "dragging" ? xOffset : timelineWidth * progress;
  useDrag();
  return (
    <button
      {...props}
      style={{
        position: "absolute",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        cursor: "grab",
        transform: `translate(calc(${offset}px - 20px), 0)`,
        ...props.style,
      }}
      aria-label="Drag to seek"
      onPointerDown={() => {
        dispatch({
          type: "DRAG_START",
          clientX: offset,
        });
      }}
      onKeyDown={(event) =>
        handleTimelineKeys({
          event,
          currentTime: time,
          duration: element?.duration ?? 0,
          dispatch,
          dispatchPlayer,
        })
      }
    />
  );
}
