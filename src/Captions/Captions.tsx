import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

export const Captions = (props: React.HTMLAttributes<HTMLElement>) => {
  const { cues } = useContext(PlayerContext);
  return (
    <section
      aria-label="Captions"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      role="region"
      tabIndex={0}
      {...props}
    >
      {cues.map((cue, i) => (
        <p key={i}>{cue.text}</p>
      ))}
    </section>
  );
};
