import { memo, useCallback, useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

type AudioElementProps = React.AudioHTMLAttributes<HTMLAudioElement> & {
  children?: React.ReactNode;
};

export const AudioElement = memo(function AudioElement({
  children,
  ...props
}: AudioElementProps) {
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

  // `setElement` is stable by React's `useState` guarantee, so the ref is stable
  // and this component's `memo` cannot cause a detach/reattach on every parent
  // render.
  const ref = useCallback((node: HTMLAudioElement | null) => {
    setElement(node);
  }, []);

  /**
   * The one handler left, and it is policy rather than projection: on `ended` the
   * element sits at `duration` while the UI wants the thumb at the start. Moving
   * the *element* to 0 removes the divergence — `seeked` fires, the atoms follow,
   * and the thumb and the clock agree. Everything else this element used to
   * handle is a projection, and `syncFromElement` does it.
   */
  const handleEnded = useCallback(() => {
    store.send({ type: "SET_TIME_TO_START" });
  }, [store]);

  return (
    <audio
      {...props}
      src={src}
      aria-label="audio player"
      ref={ref}
      onEnded={handleEnded}
    >
      {children ? children : undefined}
    </audio>
  );
});
