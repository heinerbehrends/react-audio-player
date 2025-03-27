import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";

export const Captions = (props: React.HTMLAttributes<HTMLElement>) => {
  const { cues } = useContext(PlayerContext);
  console.log("cues", cues);
  return (
    <section
      aria-label="Transcript"
      aria-live="polite"
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
