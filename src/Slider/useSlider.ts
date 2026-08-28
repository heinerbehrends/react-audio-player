import { useCallback, useEffect, useRef, useState } from "react";
import { calculateSliderValue } from "../Shared/sharedFunctions";
import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useIsDisabled } from "../store/derived";
import {
  ARROW_KEYS,
  JUMP_KEYS,
  SLIDER_MODES,
  isArrowKey,
  isJumpKey,
  type Orientation,
  type SliderMode,
} from "./sliderModes";

type PositionEvent =
  | { clientX: number; clientY: number }
  | { touches: ArrayLike<{ clientX: number; clientY: number }> };

export type SliderAriaAttributes = {
  /**
   * `true` while the player is not ready, absent otherwise. Not the native
   * `disabled` attribute: the tab stop is the slider's keyboard surface.
   */
  "aria-disabled"?: true | undefined;
  "aria-label": string;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  "aria-valuetext": string;
  "aria-orientation": Orientation;
};

export type SliderValue = {
  mode: SliderMode;
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  orientation: Orientation;
  sliderStart: number;
  sliderLength: number;
  dragState: "idle" | "dragging";
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
 * Drives one slider of any kind. Owns drag state and geometry, and returns the
 * whole `SliderContext` value: the display value, the aria surface, a ref
 * callback and the pointer and keyboard handlers. `Timeline`, `Volume` and
 * `PlaybackRateSlider` are configuration over this.
 *
 * Call it once, at the slider root. A slider is three sibling components — the
 * element carrying the semantics measures the track while the progress bar and
 * the thumb consume that measurement — and consumers place all three freely in
 * their own markup, so there is no prop-drilling path between them.
 *
 * The `useCallback`s below are for effect-dependency stability, not render
 * memoization. `valueAt`, `commit`, `send` and `releaseAudibleVolume` feed the
 * drag effect, which would otherwise re-attach five window listeners on every
 * pointermove; `measure` feeds the ResizeObserver; `setSliderRef` is a ref
 * callback, and an unstable one re-attaches the node.
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
  const isDisabled = useIsDisabled();

  const valueFromStore = useStore(
    mode === "seek"
      ? store.currentTime
      : mode === "volume"
        ? store.volume
        : store.rate,
  );

  const ariaValueFromStore = useStore(
    mode === "seek"
      ? store.currentSecond
      : mode === "volume"
        ? store.volume
        : store.rate,
  );

  const duration = useStore(store.duration);
  // Every mode subscribes, though only `"volume"` announces it: a hook call
  // cannot be gated on the mode, and this is one rarely-changing boolean.
  const muted = useStore(store.muted);

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

  // Read by the drag's window listeners, which outlive the render that attached
  // them, so a change here does not force a re-attach.
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
      // Bail out on an unchanged measurement, or the `ResizeObserver` would
      // loop.
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
   * Dropping the local value the instant a drag ends causes a visible
   * snap-back: the commit writes the element, but the atom still holds the
   * pre-drag value until the element echoes back — up to ~250 ms in `"seek"`
   * mode. So the committed value is retained until the store moves off what it
   * held when the commit went out.
   *
   * Compared against the store value *at commit time*, not against the
   * committed value: an element may echo back a slightly different time than
   * the one it was given, which would freeze the display for good.
   * Click-to-set has the same gap, so this lives here rather than in one commit
   * handler.
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
   * coupling: for the volume component, zero mutes and anything above it
   * unmutes, so that is one rule in one place rather than one per gesture.
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

  const holdAudibleVolume = useCallback(() => {
    if (!config.mutesAtZero) return;
    releaseHoldRef.current?.();
    releaseHoldRef.current = store.holdAudibleVolume();
  }, [config, store]);

  const releaseAudibleVolume = useCallback(() => {
    releaseHoldRef.current?.();
    releaseHoldRef.current = null;
  }, []);

  // A gesture cut short by an unmount would otherwise leave `lastAudibleVolume`
  // frozen for the life of the store.
  useEffect(() => releaseAudibleVolume, [releaseAudibleVolume]);

  const onThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const clientXY = positionOf(event, orientation);
      // Where inside the thumb the pointer grabbed. Subtracting it stops an
      // off-centre grab from jumping the value on the first move.
      const grabOffset =
        orientation === "horizontal"
          ? clientXY - rect.left - rect.width / 2
          : clientXY - rect.top - rect.height / 2;

      if (config.mutesAtZero) {
        // Grabbing the thumb of a silenced player makes it audible again, at the
        // remembered volume — which is why the hold can come after.
        store.send({ type: "UNMUTE" });
      }
      holdAudibleVolume();
      beginDrag(valueAt(clientXY - grabOffset), grabOffset);
    },
    [
      isDisabled,
      orientation,
      config,
      store,
      holdAudibleVolume,
      beginDrag,
      valueAt,
    ],
  );

  const onTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      const pressedAt = positionOf(event, orientation);
      holdAudibleVolume();
      commit(valueAt(pressedAt));

      function onFirstMove(moveEvent: PointerEvent | TouchEvent) {
        const position = positionOf(moveEvent, orientation);
        if (position === pressedAt) return;
        stopWaiting();
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
      isDisabled,
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
        // Swallowed, not passed on: the global map seeks on `ArrowRight` and
        // changes the volume on `ArrowUp`, so falling through would let a
        // disabled slider drive the player. No `preventDefault()` — a control
        // that does nothing should not eat the scroll.
        if (isDisabled) return;
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
      if (isJumpKey(event.key)) {
        if (isDisabled) return;
        // `commit`, not `send`: a jump has the same echo gap as a click, so in
        // `"seek"` mode the display would snap back until the element caught up.
        commit(JUMP_KEYS[event.key] === "minValue" ? minValue : maxValue);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handleMediaKeys(event);
    },
    [
      isDisabled,
      step,
      config,
      store,
      handleMediaKeys,
      commit,
      minValue,
      maxValue,
    ],
  );

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
      "aria-disabled": isDisabled || undefined,
      "aria-label": config.ariaLabel,
      "aria-valuemin": minValue,
      "aria-valuemax": maxValue,
      "aria-valuenow": ariaValue,
      "aria-valuetext": config.ariaValueText({
        value: ariaValue,
        maxValue,
        muted,
      }),
      "aria-orientation": orientation,
    },
    setSliderRef,
    onTrackPointerDown,
    onThumbPointerDown,
    onKeyDown,
  };
}
