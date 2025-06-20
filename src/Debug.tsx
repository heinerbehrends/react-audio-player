import { useContext } from "react";
import { PlayerContext } from "./Player/PlayerContext";
import { TimelineContext } from "./Timeline/TimelineContext";
import { VolumeContext } from "./Volume/VolumeContext";
import { AudioContext } from "./AudioElement/AudioContext";
import { PlaybackRateContext } from "./PlaybackRate/PlaybackRateContext";

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
  const {
    playerState: state,
    volumeState,
    isMuted,
    unmuteVolumeRef: { current: unmuteVolume },
  } = useContext(PlayerContext);
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
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
      <h3>Player</h3>
      <p>State: {state}</p>
      <p>Element: {audioElement?.src}</p>
      {/* <p>Cue Text: {cues[0]?.text}</p> */}
      <h3> {type}</h3>
      <p>Value: {context.value.toFixed(2)}</p>
      <p>Left: {context.sliderStart}</p>
      <p>Width: {context.sliderLength}</p>
      <p>Drag State: {context.dragState}</p>
      <p>X Offset: {context.clientXY}</p>
      <p>Offset From Middle: {context.offsetFromMiddle}</p>
      <p>Orientation: {context.orientation}</p>
      <p>Unmute Volume: {unmuteVolume}</p>
      <p>Volume state: {volumeState}</p>
      <p>Min Value: {context.minValue}</p>
      <p>Max Value: {context.maxValue}</p>
      <p>Audio Element muted: {isMuted ? "true" : "false"}</p>
    </div>
  );
}
