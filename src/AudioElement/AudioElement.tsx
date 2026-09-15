import { useCallback, useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
  /** Forwarded to the consumer, alongside the store's own attachment. */
  audioRef?: React.Ref<HTMLAudioElement> | undefined;
};

/**
 * Writes an element into whichever ref shape the consumer passed.
 *
 * At module scope so the ref arrives as a plain parameter: inside the component
 * it is a prop, and `react-hooks/immutability` cannot tell filling a forwarded
 * ref from mutating one. `Ref<T>`'s object form declares `current` readonly,
 * which holds for the consumer but not for whoever owns the element — hence the
 * cast.
 */
function assignRef<T>(ref: React.Ref<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T | null>).current = value;
}

export function AudioElement({
  children,
  onEnded,
  audioRef,
  ...props
}: AudioElementProps) {
  const { audioFile } = usePlayerConfig();
  const { src } = audioFile ?? {};

  const store = usePlayerStore();
  const [element, setElement] = useState<HTMLAudioElement | null>(null);

  useEffect(
    () => (element ? store.attach(element) : undefined),
    [element, store],
  );

  // React re-invokes a ref callback whose identity changed, so an inline arrow
  // would detach and reattach the store on every render.
  const ref = useCallback((node: HTMLAudioElement | null) => {
    setElement(node);
  }, []);

  // Filled from the element state rather than from the ref callback above,
  // which has to stay stable.
  useEffect(() => {
    if (!audioRef) return;
    assignRef(audioRef, element);
    return () => assignRef(audioRef, null);
  }, [element, audioRef]);

  return (
    <audio
      // Before the spread, so `audioProps` can replace it (A15).
      aria-label="audio player"
      {...props}
      src={src}
      ref={ref}
      // Passed straight through: the element parks at the end, and `play()` on
      // an ended element seeks to 0 by itself (measured in Chrome), so rewinding
      // here bought no replay and destroyed the stop position. Firefox also
      // fires `ended` on a *paused* seek to `duration`, where Chrome fires
      // nothing (B4).
      onEnded={onEnded}
    >
      {children ? children : undefined}
    </audio>
  );
}
