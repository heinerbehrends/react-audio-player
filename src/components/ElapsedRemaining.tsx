import { useState } from "react";
import { useAudioPlayer } from "../logic/useAudioPlayer";

export function ElapsedRemaining() {
  const [showElapsed, setShowElapsed] = useState(true);
  const { currentTime, remainingTime } = useAudioPlayer();
  return (
    <button
      aria-label={showElapsed ? "Show remaining time" : "Show elapsed time"}
      onClick={() => setShowElapsed(!showElapsed)}
    >
      <span aria-live="polite">
        {showElapsed ? currentTime : `-${remainingTime}`}
      </span>
    </button>
  );
}
