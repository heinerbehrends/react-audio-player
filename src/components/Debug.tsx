import { AudioPlayerContext } from "./AudioPlayerContext";

const { useSelector } = AudioPlayerContext;

export function Debug() {
  const loopStartState = useSelector((state) => state.value.dragLoopStart);
  const loopEndState = useSelector((state) => state.value.dragLoopEnd);
  const loopMarkerEnd = useSelector((state) => state.context.loopMarkerEnd);
  const loopMarkerStart = useSelector((state) => state.context.loopMarkerStart);
  const dragXOffset = useSelector((state) => state.context.dragXOffset);
  const timelineLeft = useSelector((state) => state.context.timelineLeft) ?? 0;
  const timelineWidth =
    useSelector((state) => state.context.timelineWidth) ?? 1;
  const duration = useSelector((state) => state.context.ref?.duration);
  const currentTime = useSelector((state) => state.context.position);
  const relativePositionEnd = (loopMarkerEnd - timelineLeft) / timelineWidth;
  const relativeTimeEnd = relativePositionEnd * (duration ?? 1);
  return (
    <div>
      <div>loopStartState: {loopStartState}</div>
      <div>loopEndState: {loopEndState}</div>
      <div>loopMarkerStart: {loopMarkerStart}</div>
      <div>loopMarkerEnd: {loopMarkerEnd}</div>
      <div>dragXOffset: {dragXOffset}</div>
      <div>timelineLeft: {timelineLeft}</div>
      <div>timelineWidth: {timelineWidth}</div>
      <div>duration: {duration}</div>
      <div>currentTime: {currentTime}</div>
      <div>relativePositionEnd: {relativePositionEnd}</div>
      <div>relativeTimeEnd: {relativeTimeEnd}</div>
    </div>
  );
}
