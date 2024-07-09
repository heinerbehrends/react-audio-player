import { AudioPlayerContext } from "../components/AudioPlayerContext";

export function useDrag() {
  const { send } = AudioPlayerContext.useActorRef();
  const dragState = AudioPlayerContext.useSelector((state) => state.value.drag);
  const dragXOffset = AudioPlayerContext.useSelector(
    (state) => state.context.dragXOffset
  );
  const timelineLeft = AudioPlayerContext.useSelector(
    (state) => state.context.timelineLeft
  );
  const timelineWidth = AudioPlayerContext.useSelector(
    (state) => state.context.timelineWidth
  );
  const duration = AudioPlayerContext.useSelector(
    (state) => state.context?.ref?.duration
  );
  const currentTime = AudioPlayerContext.useSelector(
    (state) => state.context?.position
  );
  const elapsedPercentage = (currentTime / (duration ?? 1)) * 100;

  return {
    send,
    dragState,
    dragXOffset,
    timelineLeft,
    timelineWidth,
    elapsedPercentage,
  };
}
