import { useContext } from "react";
import { PlayerContext } from "./Player/PlayerContext";
import { TimelineContext } from "./Timeline/TimelineVolumeContext";
import { VolumeContext } from "./Volume/VolumeContext";
import { AudioContext } from "./AudioElement/AudioContext";
const mapContext = {
  timeline: TimelineContext,
  volume: VolumeContext,
};

export function Debug({ type }: { type: "timeline" | "volume" }) {
  const { player: state, cues } = useContext(PlayerContext);
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
        top: 60,
        left: 0,
      }}
    >
      <h3>Player</h3>
      <p>State: {state}</p>
      <p>Element: {audioElement?.src}</p>
      <p>Cue Text: {cues[0]?.text}</p>
      <h3> {type}</h3>
      <p>Time: {context.time.toFixed(2)}</p>
      <p>Left: {context.sliderStart}</p>
      <p>Width: {context.sliderLength}</p>
      <p>Drag State: {context.dragState}</p>
      <p>X Offset: {context.xOffset}</p>
    </div>
  );
}
