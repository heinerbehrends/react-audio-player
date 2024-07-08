import { useState } from "react";
import { useAudioPlayer } from "../logic/useAudioPlayer";

export function ElapsedRemaining() {
  const [showElapsed, setShowElapsed] = useState(true);
  const { currentTime, remainingTime } = useAudioPlayer();
  return (
    <button onClick={() => setShowElapsed(!showElapsed)}>
      {showElapsed ? currentTime : remainingTime}
    </button>
  );
}
