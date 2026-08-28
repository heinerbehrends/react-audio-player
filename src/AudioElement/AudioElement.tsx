import { useCallback, useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
};

export function AudioElement({ children, ...props }: AudioElementProps) {
  const { audioFiles } = usePlayerConfig();
  const { src } = audioFiles?.[0] || {};

  // `AudioElement` renders the `<audio>` tag, so it is the only component that
  // can hand the element to the store without a setter travelling down — and a
  // setter reachable through context would be a second write-shaped door on a
  // store whose whole design is that `attach` is the only one.
  const store = usePlayerStore();
  const [element, setElement] = useState<HTMLAudioElement | null>(null);

  useEffect(
    () => (element ? store.attach(element) : undefined),
    [element, store],
  );

  // Not render memoization: React calls a ref callback with `null` and then the
  // node again whenever its identity changes, so an inline arrow here would
  // detach and reattach the element — and therefore the store — on every render
  // of this component. `setElement` is stable by React's `useState` guarantee,
  // so the empty dependency list is honest.
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
       * The one handler left, and it is policy rather than projection: on `ended`
       * the element sits at `duration` while the UI wants the thumb at the start.
       * Moving the *element* to 0 removes the divergence — `seeked` fires, the
       * atoms follow, and the thumb and the clock agree. Everything else this
       * element used to handle is a projection, and `syncFromElement` does it.
       */
      onEnded={() => store.send({ type: "SET_TIME_TO_START" })}
    >
      {children ? children : undefined}
    </audio>
  );
}
