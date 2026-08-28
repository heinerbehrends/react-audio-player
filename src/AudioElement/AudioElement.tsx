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
  // which has to stay stable. `RefObject.current` is readonly to consumers but
  // writable by whoever owns the element — hence the cast.
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
       * Policy, not projection: on `ended` the element sits at `duration` while
       * the UI wants the thumb back at the start. Moving the element itself
       * fires `seeked`, and the atoms follow.
       */
      onEnded={(event) => {
        // Rewind first, so a consumer swapping `src` from here lands on an
        // element that is at 0 rather than at `duration`.
        store.send({ type: "SET_TIME_TO_START" });
        onEnded?.(event);
      }}
    >
      {children ? children : undefined}
    </audio>
  );
}
