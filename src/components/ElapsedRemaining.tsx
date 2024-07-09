import { useState } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";

const { useSelector } = AudioPlayerContext;

export function ElapsedRemaining() {
  const [showElapsed, setShowElapsed] = useState(true);
  const currentTime = useSelector((state) => state.context?.position);
  const remainingTime = useSelector(
    (state) => (state.context?.ref?.duration ?? 0) - state.context?.position
  );

  const displayedTime = showElapsed
    ? formatTime(currentTime)
    : formatTime(remainingTime);

  return (
    <button
      aria-label={showElapsed ? "Show remaining time" : "Show elapsed time"}
      onClick={() => setShowElapsed(!showElapsed)}
    >
      <span aria-live="polite">{displayedTime}</span>
    </button>
  );
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
