import { useContext } from "react";
import { AudioContext } from "../AudioElement/AudioContext";

type IncreaseDecreaseProps = {
  amount: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function IncreaseDecrease({
  amount,
  children,
  ...props
}: IncreaseDecreaseProps) {
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContext);
  function handleClick() {
    if (!audioElement) return;
    const newRate = audioElement.playbackRate + amount;
    const limitedRate = Math.min(Math.max(newRate, 0.5), 4);
    audioElement.playbackRate = limitedRate;
  }
  return (
    <button
      aria-label={
        amount > 0
          ? `Increase speed by ${amount}`
          : `Decrease speed by ${amount}`
      }
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
