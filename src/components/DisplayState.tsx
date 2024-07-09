import { AudioPlayerContext } from "./AudioPlayerContext";

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
      <p>{JSON.stringify(dragMachineState, null, 2)}</p>
      <p>{dragXOffset}</p>
    </>
  );
}
