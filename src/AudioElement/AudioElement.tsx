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

  // This component renders the `<audio>` tag, so it can attach the store
  // directly. Passing a setter down through context would be a second way to
  // write a store designed to have exactly one.
  const store = usePlayerStore();
  const [element, setElement] = useState<HTMLAudioElement | null>(null);

  useEffect(
    () => (element ? store.attach(element) : undefined),
    [element, store],
  );

  // Not render memoization: React re-invokes a ref callback whose identity
  // changed, so an inline arrow would detach and reattach the store every
  // render.
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
      {...props}
      src={src}
      aria-label="audio player"
      ref={ref}
      /**
       * Passed straight through. The element parks at the end, so a consumer's
       * handler can read where playback stopped; `play()` on an ended element
       * seeks to 0 by itself, measured in Chrome, so rewinding here bought no
       * replay and only destroyed that.
       *
       * Not the same event in every browser: Firefox also fires `ended` on a
       * *paused* seek to `duration`, where Chrome fires nothing — so a drag to
       * the end of the timeline calls this in Firefox only. 
       */
      onEnded={onEnded}
    >
      {children ? children : undefined}
    </audio>
  );
}
