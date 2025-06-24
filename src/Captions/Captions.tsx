import { ToggleCaptions } from "./ToggleCaptions";
import { useCaptionsContext } from "./CaptionsContext";
import { CaptionsProvider } from "./CaptionsProvider";

// The base display component
function CaptionsDisplay(props: React.HTMLAttributes<HTMLElement>) {
  const { cues, showCaptions } = useCaptionsContext();
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

// Root component that includes the provider
function CaptionsRoot({ children }: { children?: React.ReactNode }) {
  return <CaptionsProvider>{children}</CaptionsProvider>;
}

export const Captions = Object.assign(CaptionsRoot, {
  Display: CaptionsDisplay,
  Toggle: ToggleCaptions,
});
