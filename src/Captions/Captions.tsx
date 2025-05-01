import { useContext } from "react";
import { PlayerContext } from "../Player/PlayerContext";
import { ToggleCaptions } from "./ToggleCaptions";

function CaptionsComponent(props: React.HTMLAttributes<HTMLElement>) {
  const { cues, showCaptions } = useContext(PlayerContext);

  if (!showCaptions) return null;

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
}

type Captions = React.NamedExoticComponent<{
  children: React.ReactNode;
}> & {
  Toggle: React.NamedExoticComponent;
};

export const Captions = Object.assign(CaptionsComponent, {
  Toggle: ToggleCaptions,
});
