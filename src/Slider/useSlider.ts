import { useCallback, useEffect, useRef, useState } from "react";
import { calculateSliderValue } from "../Shared/sharedFunctions";
import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import {
  ARROW_KEYS,
  SLIDER_MODES,
  isArrowKey,
  type Orientation,
  type SliderMode,
} from "./sliderModes";

/** Anything carrying a pointer position, React-synthetic or native. */
type PositionEvent =
  | { clientX: number; clientY: number }
  | { touches: ArrayLike<{ clientX: number; clientY: number }> };

export type SliderAriaAttributes = {
  "aria-label": string;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  "aria-valuetext": string;
  "aria-orientation": Orientation;
};

export type SliderValue = {
  mode: SliderMode;
  /**
   * The display value, in the slider's own units. Consumed by `Progress` and
   * `Drag` for pixels, so in `"seek"` mode it follows `currentTime` at event
   * rate.
   */
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  orientation: Orientation;
  sliderStart: number;
  sliderLength: number;
  dragState: "idle" | "dragging";
  /**
   * The other half of the contract: every `aria-value*` is computed from the 1 Hz
   * source, never from `value`. React writes a DOM attribute only when its value
   * changes, so this is what keeps the accessibility tree quiet while the
   * progress element moves at event rate.
   */
  aria: SliderAriaAttributes;
  /** Ref callback for the element that carries the slider semantics. */
  setSliderRef: (element: HTMLButtonElement | null) => void;
  onTrackPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onThumbPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export type UseSliderOptions = {
  mode: SliderMode;
  orientation?: Orientation;
  minValue?: number;
  maxValue?: number;
  step?: number;
};

const IDLE = { state: "idle" } as const;

type DragState = typeof IDLE | { state: "dragging"; value: number };

function positionOf(event: PositionEvent, orientation: Orientation): number {
  if ("touches" in event) {
    const touch = event.touches[0];
    if (!touch) return 0;
    return orientation === "horizontal" ? touch.clientX : touch.clientY;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}

/**
 * One slider, whatever kind. Owns drag state and geometry and returns the whole
 * `SliderContext` value: the display value, the aria surface, a ref callback and
 * the pointer and keyboard handlers. `Timeline`, `Volume` and
 * `PlaybackRateSlider` are configuration over this.
 *
 * Call it once, at the slider root. One slider is three sibling components: the
 * geometry is measured by the element carrying the semantics while the progress
 * bar and the thumb consume it, and consumers place all three freely in their own
 * markup, so there is no prop-drilling path between them.
 */
export function useSlider({
  mode,
  orientation = "horizontal",
  minValue: minValueOption,
  maxValue: maxValueOption,
  step: stepOption,
}: UseSliderOptions): SliderValue {
  const config = SLIDER_MODES[mode];
  const store = usePlayerStore();
  const handleMediaKeys = useHandleMediaKeys();

  // One `useStore` per source, with the atom chosen by mode, so a volume slider
  // does not subscribe to `currentTime` and re-render at event rate.
  const valueFromStore = useStore(
    mode === "seek"
      ? store.currentTime
      : mode === "volume"
        ? store.volume
        : store.rate,
  );
  // Only `"seek"` has two sources: `volume` and `rate` are event-driven rather
  // than sampled, so there the aria surface reads the same atom as the value.
  const ariaValueFromStore = useStore(
    mode === "seek"
      ? store.currentSecond
      : mode === "volume"
        ? store.volume
        : store.rate,
  );
  // `"seek"`'s max is not static — it *is* the duration. The other two modes
  // subscribe to an atom they ignore, which costs one listener on a value that
  // changes at most a few times per track.
  const duration = useStore(store.duration);

  const minValue = minValueOption ?? (mode === "rate" ? 0.5 : 0);
  const maxValue =
    mode === "seek" ? duration : (maxValueOption ?? (mode === "rate" ? 4 : 1));
  const step = stepOption ?? 0;

  const [geometry, setGeometry] = useState({ sliderStart: 0, sliderLength: 0 });
  const [drag, setDrag] = useState<DragState>(IDLE);
  const [committed, setCommitted] = useState<{
    value: number;
    storeValue: number;
  } | null>(null);

  // Read by handlers that outlive a render — the drag's window listeners — so
  // they do not have to be re-attached every time one of these changes.
  const grabOffsetRef = useRef(0);
  const releaseHoldRef = useRef<(() => void) | null>(null);
  const valueFromStoreRef = useRef(valueFromStore);
  useEffect(() => {
    valueFromStoreRef.current = valueFromStore;
  }, [valueFromStore]);

  const elementRef = useRef<HTMLButtonElement | null>(null);
  const measure = useCallback(
    (element: HTMLButtonElement) => {
      const rect = element.getBoundingClientRect();
      const next = {
        sliderStart: orientation === "horizontal" ? rect.left : rect.top,
        sliderLength: orientation === "horizontal" ? rect.width : rect.height,
      };
      // Bail out on an unchanged measurement: a `ResizeObserver` that always set
      // state would loop.
      setGeometry((current) =>
        current.sliderStart === next.sliderStart &&
        current.sliderLength === next.sliderLength
          ? current
          : next,
      );
    },
    [orientation],
  );

  const setSliderRef = useCallback(
    (element: HTMLButtonElement | null) => {
      elementRef.current = element;
      if (element) measure(element);
    },
    [measure],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => measure(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  /**
   * Dropping the local value the instant a drag ends is wrong: the commit writes
   * the element, drag state clears, and display falls through to an atom that
   * still holds the pre-drag value until the element echoes back — a visible
   * snap-back of up to ~250 ms in `"seek"` mode. So the last committed value is
   * retained until the store moves off what it held when the commit went out.
   *
   * Compared against the store value *at commit time*, not against the committed
   * value: a media element may echo back a slightly different time than the one
   * it was given, and comparing to the committed value would freeze the display
   * for good. Click-to-set has the same gap as a drag release, which is why this
   * is a property of `useSlider` rather than of one commit handler.
   */
  const displayValue =
    drag.state === "dragging"
      ? drag.value
      : committed && committed.storeValue === valueFromStore
        ? committed.value
        : valueFromStore;

  useEffect(() => {
    if (committed && committed.storeValue !== valueFromStore) {
      setCommitted(null);
    }
  }, [committed, valueFromStore]);

  const valueAt = useCallback(
    (clientXY: number) =>
      calculateSliderValue({
        clientXY,
        sliderStart: geometry.sliderStart,
        sliderLength: geometry.sliderLength,
        minValue,
        maxValue,
        orientation,
        step,
      }),
    [geometry, minValue, maxValue, orientation, step],
  );

  /**
   * `CHANGE_VALUE` carries the value rather than the geometry, so the value is
   * computed once, here, where the geometry lives. It also owns the mute
   * coupling: for the volume component it mutes at zero and unmutes above it, so
   * "mute at zero" is one rule in one place rather than a rule per gesture.
   */
  const send = useCallback(
    (value: number) => {
      store.send({ type: "CHANGE_VALUE", component: config.component, value });
    },
    [store, config],
  );

  const commit = useCallback(
    (value: number) => {
      setCommitted({ value, storeValue: valueFromStoreRef.current });
      send(value);
    },
    [send],
  );

  const beginDrag = useCallback((value: number, grabOffset: number) => {
    grabOffsetRef.current = grabOffset;
    setDrag({ state: "dragging", value });
  }, []);

  /**
   * Freeze the audible-volume memory for the gesture, so unmuting afterwards
   * restores the volume from before it rather than the last non-zero value the
   * gesture passed through. Taken before the first write, so which value is
   * remembered does not depend on when the element echoes back.
   */
  const holdAudibleVolume = useCallback(() => {
    if (!config.mutesAtZero) return;
    releaseHoldRef.current?.();
    releaseHoldRef.current = store.holdAudibleVolume();
  }, [config, store]);

  const releaseAudibleVolume = useCallback(() => {
    releaseHoldRef.current?.();
    releaseHoldRef.current = null;
  }, []);

  // A gesture interrupted by an unmount would otherwise leave the memory frozen
  // for the life of the store.
  useEffect(() => releaseAudibleVolume, [releaseAudibleVolume]);

  const onThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clientXY = positionOf(event, orientation);
      // Where inside the thumb the pointer grabbed. Subtracting it is what stops
      // an off-centre grab jumping the value on the first move — `"seek"` did
      // this and the other two did not.
      const grabOffset =
        orientation === "horizontal"
          ? clientXY - rect.left - rect.width / 2
          : clientXY - rect.top - rect.height / 2;

      if (config.mutesAtZero) {
        // Grabbing the thumb of a silenced player makes it audible again — at the
        // remembered volume, which is why the hold can come after.
        store.send({ type: "UNMUTE" });
      }
      holdAudibleVolume();
      beginDrag(valueAt(clientXY - grabOffset), grabOffset);
    },
    [orientation, config, store, holdAudibleVolume, beginDrag, valueAt],
  );

  const onTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const pressedAt = positionOf(event, orientation);
      holdAudibleVolume();
      commit(valueAt(pressedAt));

      // Pressing the track and *moving* before lifting continues as a drag, with
      // no grab offset: the pointer is on the track, not on a thumb. A press
      // that lifts without moving stays a click, so a click never leaves the
      // slider reporting `dragState: "dragging"`.
      function onFirstMove(moveEvent: PointerEvent | TouchEvent) {
        const position = positionOf(moveEvent, orientation);
        if (position === pressedAt) return;
        stopWaiting();
        // The drag takes over the hold from here; releasing is its business.
        beginDrag(valueAt(position), 0);
      }

      function onPressEnd() {
        stopWaiting();
        releaseAudibleVolume();
      }

      function stopWaiting() {
        window.removeEventListener("pointermove", onFirstMove);
        window.removeEventListener("touchmove", onFirstMove);
        window.removeEventListener("pointerup", onPressEnd);
        window.removeEventListener("touchend", onPressEnd);
      }

      window.addEventListener("pointermove", onFirstMove);
      window.addEventListener("touchmove", onFirstMove);
      window.addEventListener("pointerup", onPressEnd);
      window.addEventListener("touchend", onPressEnd);
    },
    [
      orientation,
      commit,
      valueAt,
      beginDrag,
      holdAudibleVolume,
      releaseAudibleVolume,
    ],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isArrowKey(event.key)) {
        const amount = step || config.defaultArrowStep;
        store.send(
          ARROW_KEYS[event.key] === "increase"
            ? config.increase(amount)
            : config.decrease(amount),
        );
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handleMediaKeys(event);
    },
    [step, config, store, handleMediaKeys],
  );

  // Window-level for the duration of the drag, so the pointer can leave the
  // thumb without ending it. Every dependency is stable while a drag is in
  // progress, so the listeners are attached once per drag rather than once per
  // pointermove.
  const dragging = drag.state === "dragging";
  useEffect(() => {
    if (!dragging) return;

    function valueFor(event: PointerEvent | TouchEvent) {
      return valueAt(positionOf(event, orientation) - grabOffsetRef.current);
    }

    function move(event: PointerEvent | TouchEvent) {
      const value = valueFor(event);
      setDrag((current) =>
        current.state === "dragging" ? { state: "dragging", value } : current,
      );
      // `"seek"` commits on release only: nothing echoes back mid-drag, so
      // writing the element would scrub the audio. The other two write, which is
      // also where their value comes back from.
      if (config.writesDuringDrag) {
        send(value);
      }
    }

    function end(event: PointerEvent | TouchEvent) {
      commit(valueFor(event));
      releaseAudibleVolume();
      setDrag(IDLE);
    }

    function cancel() {
      releaseAudibleVolume();
      setDrag(IDLE);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("touchcancel", cancel);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("touchcancel", cancel);
    };
  }, [
    dragging,
    orientation,
    valueAt,
    commit,
    send,
    config,
    releaseAudibleVolume,
  ]);

  // The aria value follows the local value while one is in play, so a drag or a
  // keypress is announced as the value being chosen rather than as the element's
  // last echo.
  const ariaValue = config.quantizeAriaValue(
    displayValue === valueFromStore ? ariaValueFromStore : displayValue,
  );

  return {
    mode,
    value: displayValue,
    minValue,
    maxValue,
    step,
    orientation,
    sliderStart: geometry.sliderStart,
    sliderLength: geometry.sliderLength,
    dragState: drag.state,
    aria: {
      "aria-label": config.ariaLabel,
      "aria-valuemin": minValue,
      "aria-valuemax": maxValue,
      "aria-valuenow": ariaValue,
      "aria-valuetext": config.ariaValueText(ariaValue, maxValue),
      "aria-orientation": orientation,
    },
    setSliderRef,
    onTrackPointerDown,
    onThumbPointerDown,
    onKeyDown,
  };
}
