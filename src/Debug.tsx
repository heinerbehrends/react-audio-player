import { useContext } from "react";
import { TimelineContext } from "./Timeline/TimelineContext";
import { VolumeContext } from "./Volume/VolumeContext";
import { PlaybackRateContext } from "./PlaybackRate/PlaybackRateContext";
import { usePlayerStore } from "./store/PlayerStoreContext";
import { useStore } from "./store/atom";
import { usePlayerState, useVolumeState } from "./store/derived";

const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
  playbackRate: PlaybackRateContext,
};

export function Debug({
  type,
}: {
  type: "timeline" | "volume" | "playbackRate";
}) {
  const context = useContext(mapContext[type]);

  return (
    <div
      style={{
        textAlign: "left",
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        position: "absolute",
        top: 300,
        left: type === "timeline" ? 60 : 400,
      }}
    >
      <h3> {type}</h3>
      <p>Value: {context.value.toFixed(2)}</p>
      <p>Left: {context.sliderStart}</p>
      <p>Width: {context.sliderLength}</p>
      <p>Drag State: {context.dragState}</p>
      <p>X Offset: {context.clientXY}</p>
      <p>Offset From Middle: {context.offsetFromMiddle}</p>
      <p>Orientation: {context.orientation}</p>
      <p>Min Value: {context.minValue}</p>
      <p>Max Value: {context.maxValue}</p>
      <DebugStore />
    </div>
  );
}

/**
 * The store column. The reducer column above it is gone, and so is this view's
 * own copy of the `playerState` rule: a debug view that derives differently from
 * the app can silently disagree with the app it exists to verify.
 */
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
