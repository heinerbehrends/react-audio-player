import { useAudioPlayer } from "../logic/useAudioPlayer";
import { AudioPlayerContext } from "./ActorContext";

export function DisplayState() {
  const state = AudioPlayerContext.useSelector((state) => state.value);
  const audioElement = AudioPlayerContext.useSelector(
    (state) => state.context.ref
  );

  const { dragXOffset, dragMachineState } = useAudioPlayer();
  return (
    <>
      <p>{state.valueOf().toString()}</p>
      <p>{String(audioElement)}</p>
      <p>{dragMachineState}</p>
      <p>{dragXOffset}</p>
    </>
  );
}
