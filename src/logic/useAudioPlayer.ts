import { AudioPlayerContext } from "../components/AudioPlayerContext";

export function useAudioPlayer() {
  const duration = AudioPlayerContext.useSelector(
    (state) => state.context?.ref?.duration
  );
  const currentTime = AudioPlayerContext.useSelector(
    (state) => state.context?.position
  );
  const isPlaying = AudioPlayerContext.useSelector(
    (state) => state.value.track === "playing"
  );
  const elapsedPercentage = (currentTime / (duration ?? 1)) * 100;
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
  const { send } = AudioPlayerContext.useActorRef();
  // const dragMachine = AudioPlayerContext.useSelector(
  //   (state) => state?.children?.dragMachine
  // );
  // const sendToDrag = dragMachine?.send;
  // const dragXOffset = (
  //   dragMachine?.getSnapshot() as {
  //     context: { dragXOffset: number | undefined };
  //   }
  // )?.context.dragXOffset;
  // const timelineLeft = (
  //   dragMachine?.getSnapshot() as {
  //     context: { timelineLeft: number | undefined };
  //   }
  // )?.context.timelineLeft;
  // const timelineWidth = (
  //   dragMachine?.getSnapshot() as {
  //     context: { timelineWidth: number | undefined };
  //   }
  // )?.context.timelineWidth;
  // const dragMachineState = AudioPlayerContext.useSelector(
  //   // @ts-expect-error - todo fix the type of the dragMachine
  //   (state) => state.children.dragMachine?.getSnapshot()?.value
  // );
  return {
    send,
    duration,
    remainingTime: formatTime((duration ?? 0) - currentTime),
    currentTime: formatTime(currentTime),
    isPlaying,
    elapsedPercentage,
    dragState,
    dragXOffset,
    timelineLeft,
    timelineWidth,
    // sendToDrag,
    // dragXOffset,
    // dragMachineState,
    // timelineLeft,
    // timelineWidth,
  };
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
