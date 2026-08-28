import { useCallback, useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
  /** Forwarded to the consumer, alongside the store's own attachment. */
  audioRef?: React.Ref<HTMLAudioElement> | undefined;
};

export function AudioElement({
  children,
  onEnded,
  audioRef,
  ...props
}: AudioElementProps) {
  const { audioFile } = usePlayerConfig();
  const { src } = audioFile ?? {};

  // Renders the `<audio>` tag, so it is the only component that can reach the
  // element without a setter travelling down. A setter reachable through context
  // would be a second write-shaped door on a store whose whole design is that
  // `attach` is the only one.
  const store = usePlayerStore();
  const [element, setElement] = useState<HTMLAudioElement | null>(null);

  useEffect(
    () => (element ? store.attach(element) : undefined),
    [element, store],
  );

  // Not render memoization: React re-invokes a ref callback whose identity
  // changed, so an inline arrow would detach and reattach the element — and
  // therefore the store — every render.
  const ref = useCallback((node: HTMLAudioElement | null) => {
    setElement(node);
  }, []);

  // The consumer's ref is filled from the element state rather than from the
  // ref callback above, which has to stay stable. `RefObject.current` is
  // readonly to consumers but writable by whoever owns the element, which here
  // is this component — hence the cast.
  useEffect(() => {
    if (!audioRef) return;
    if (typeof audioRef === "function") {
      audioRef(element);
      return () => audioRef(null);
    }
    const target = audioRef as React.MutableRefObject<HTMLAudioElement | null>;
    target.current = element;
    return () => {
      target.current = null;
    };
  }, [element, audioRef]);

  return (
    <audio
      {...props}
      src={src}
      aria-label="audio player"
      ref={ref}
      /**
       * The one handler here, and it is policy rather than projection: on `ended`
       * the element sits at `duration` while the UI wants the thumb at the start.
       * Moving the *element* to 0 removes the divergence — `seeked` fires and the
       * atoms follow. Projection is `syncFromElement`'s job.
       */
      onEnded={(event) => {
        // Policy first, so the store is already consistent when the consumer
        // reacts — someone swapping `src` from `onEnded` lands on an element
        // that is at 0 rather than at `duration`.
        store.send({ type: "SET_TIME_TO_START" });
        onEnded?.(event);
      }}
    >
      {children ? children : undefined}
    </audio>
  );
}
