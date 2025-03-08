import { useContext } from "react";
import { PlayerContext } from "./Player/PlayerContext";
import { TimelineContext } from "./Timeline/TimelineContext";

function Debug() {
  const { player: state, element } = useContext(PlayerContext);
  const { time, timelineLeft, timelineWidth, dragState, xOffset } =
    useContext(TimelineContext);
  return (
    <div>
      <p>State: {state}</p>
      <p>Element: {element?.src}</p>
      <p>Time: {time}</p>
      <p>Timeline Left: {timelineLeft}</p>
      <p>Timeline Width: {timelineWidth}</p>
      <p>Drag State: {dragState}</p>
      <p>X Offset: {xOffset}</p>
    </div>
  );
}

export default Debug;
