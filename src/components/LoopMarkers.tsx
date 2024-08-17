import { Context } from "../logic/audioPlayerMachine";
import { AudioPlayerContext } from "./AudioPlayerContext";

const { useSelector } = AudioPlayerContext;

export function LoopMarkers() {
  const { send } = AudioPlayerContext.useActorRef();
  const dragXOffset = useSelector((state) => state.context.dragXOffset);
  const [loopMarkerStart, loopMarkerEnd] = useSelector(getLoopMarkersPx);
  const dragStateStart = useSelector((state) => state.value.dragLoopStart);
  const dragStateEnd = useSelector((state) => state.value.dragLoopEnd);
  const timelineLeft = useSelector((state) => state.context.timelineLeft) ?? 0;

  return (
    <div
      style={{
        cursor: "grab",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        left:
          dragStateStart === "dragging"
            ? `${dragXOffset - timelineLeft}px`
            : `${loopMarkerStart}px`,
        width: getLoopRegionWidth({
          isStartDragging: dragStateStart === "dragging",
          isEndDragging: dragStateEnd === "dragging",
          dragXOffset,
          loopMarkerStart,
          loopMarkerEnd,
          timelineLeft,
        }),
      }}
    >
      <button
        onMouseDown={(event) => {
          console.log("drag start", event.clientX);
          send({ type: "DRAG_START", x: event.clientX, element: "loopStart" });
        }}
        style={{
          appearance: "none",
          border: "none",
          backgroundColor: "hotpink",
          cursor: "grab",
          zIndex: 1,
          width: "0",
          height: "16px",
          position: "absolute",
          top: "0",
        }}
      />
      <div
        style={{
          height: "16px",
          backgroundColor: "indigo",
          position: "absolute",
          left: "0",
          right: "0",
          top: "-50%",
        }}
      />
      <button
        onMouseDown={(event) => {
          send({ type: "DRAG_START", x: event.clientX, element: "loopEnd" });
        }}
        style={{
          width: "0",
          height: "16px",
          cursor: "grab",
          appearance: "none",
          border: "none",
          backgroundColor: "hotpink",
          position: "absolute",
          right: "0",
          top: "0",
        }}
      />
    </div>
  );
}

type GetLoopRegionWidthArgs = {
  isStartDragging: boolean;
  isEndDragging: boolean;
  dragXOffset: number;
  loopMarkerStart: number;
  loopMarkerEnd: number;
  timelineLeft: number;
};

function getLoopRegionWidth({
  isStartDragging,
  isEndDragging,
  dragXOffset,
  loopMarkerStart,
  loopMarkerEnd,
  timelineLeft,
}: GetLoopRegionWidthArgs) {
  if (isStartDragging) {
    return `${loopMarkerEnd - dragXOffset + timelineLeft}px`;
  }
  if (isEndDragging) {
    return `${dragXOffset - loopMarkerStart - timelineLeft}px`;
  }
  return `${loopMarkerEnd - loopMarkerStart}px`;
}

function getLoopMarkersPx(state: {context: Context}): [number, number] {
  const loopMarkerStart = calculateRelativePosition({
    markerPositionMs: state.context.loopMarkerStart,
    durationMs: state.context.ref?.duration, 
    timelineWidth: state.context.timelineWidth,
  });
  const loopMarkerEnd = calculateRelativePosition({
    markerPositionMs: state.context.loopMarkerEnd,
    durationMs: state.context.ref?.duration,
    timelineWidth: state.context.timelineWidth,
  });
  return [loopMarkerStart, loopMarkerEnd];
}

function calculateRelativePosition({
  markerPositionMs,
  durationMs = 1,
  timelineWidth = 1,
}: {
  markerPositionMs: number;
  durationMs: number | undefined;
  timelineWidth: number | undefined;
}) {
  return (markerPositionMs / durationMs) * timelineWidth;
}