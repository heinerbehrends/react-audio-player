import { usePlayerStore } from "./store/PlayerStoreContext";
import { useStore } from "./store/atom";
import { usePlayerState, useVolumeState } from "./store/derived";
import { useSliderContext } from "./Slider/SliderContext";

/** Renders inside a slider root, so it reads that slider's own context. */
export function Debug() {
  const slider = useSliderContext();

  return (
    <div
      style={{
        textAlign: "left",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        position: "absolute",
        top: 300,
        left: slider.mode === "seek" ? 60 : 400,
      }}
    >
      <h3>{slider.mode}</h3>
      <p>Value: {slider.value.toFixed(2)}</p>
      <p>Left: {slider.sliderStart}</p>
      <p>Width: {slider.sliderLength}</p>
      <p>Drag State: {slider.dragState}</p>
      <p>Orientation: {slider.orientation}</p>
      <p>Min Value: {slider.minValue}</p>
      <p>Max Value: {slider.maxValue}</p>
      <p>Aria Value: {slider.aria["aria-valuenow"]}</p>
      <p>Aria Text: {slider.aria["aria-valuetext"]}</p>
      <DebugStore />
    </div>
  );
}

function DebugStore() {
  const store = usePlayerStore();
  const currentTime = useStore(store.currentTime);
  const currentSecond = useStore(store.currentSecond);
  const duration = useStore(store.duration);
  const volume = useStore(store.volume);
  const muted = useStore(store.muted);
  const lastAudibleVolume = useStore(store.lastAudibleVolume);
  const rate = useStore(store.rate);
  const paused = useStore(store.paused);
  const loadState = useStore(store.loadState);
  const timeDisplay = useStore(store.timeDisplay);
  const playerState = usePlayerState();
  const volumeState = useVolumeState();

  return (
    <>
      <h3>Store</h3>
      <p>Load State: {loadState}</p>
      <p>Player State: {playerState}</p>
      <p>Volume State: {volumeState}</p>
      <p>Current Time: {currentTime.toFixed(2)}</p>
      <p>Current Second: {currentSecond}</p>
      <p>Duration: {duration.toFixed(2)}</p>
      <p>Volume: {volume.toFixed(2)}</p>
      <p>Muted: {String(muted)}</p>
      <p>Last Audible Volume: {lastAudibleVolume.toFixed(2)}</p>
      <p>Rate: {rate.toFixed(2)}</p>
      <p>Paused: {String(paused)}</p>
      <p>Time Display: {timeDisplay}</p>
    </>
  );
}
