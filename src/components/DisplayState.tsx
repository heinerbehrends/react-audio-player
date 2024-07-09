import { AudioPlayerContext } from "./AudioPlayerContext";

export function DisplayState() {
  const state = AudioPlayerContext.useSelector((state) => state.value);
  const audioElement = AudioPlayerContext.useSelector(
    (state) => state.context?.ref
  );

  return (
    <>
      <p>{state.track}</p>
      <p>{state.drag}</p>
      <p>{String(audioElement)}</p>
    </>
  );
}
