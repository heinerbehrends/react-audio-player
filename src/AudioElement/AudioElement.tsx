import { useCallback, useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
};

export function AudioElement({ children, ...props }: AudioElementProps) {
  const { audioFiles } = usePlayerConfig();
  const { src } = audioFiles?.[0] || {};

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
      onEnded={() => store.send({ type: "SET_TIME_TO_START" })}
    >
      {children ? children : undefined}
    </audio>
  );
}
