import { forwardRef, useEffect, useState, type HTMLAttributes } from "react";
import { bufferedStyles } from "../Slider/calculateStyle";
import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

/** The default size and transform, overridable without `!important`. */
const bufferedRules =
  ':where([data-part="buffered"]){width:100%;height:100%;transform:scaleX(var(--buffered,0));transform-origin:left}';

// React 19's resource props, which `@types/react` 18 does not declare.
const hoisted = {
  href: "react-headless-audio-player-buffered",
  precedence: "default",
} as React.StyleHTMLAttributes<HTMLStyleElement>;

// `suspend` too: Chromium extends `buffered` when it stops loading, with no
// `progress` after it.
const EVENTS = [
  "progress",
  "suspend",
  "loadedmetadata",
  "timeupdate",
  "seeked",
  "emptied",
];

/** The end of the downloaded range the position is in, in seconds. */
function bufferedEnd({ buffered, currentTime }: HTMLMediaElement) {
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
      return buffered.end(i);
    }
  }
  return 0;
}

/**
 * How much has downloaded ahead of the position, as a bar behind the fill.
 * Renders a `<div data-part="buffered">` scaled by its own `--buffered`,
 * `0`–`1`. Render it inside `<Timeline.Control>`.
 */
export const TimelineBuffered = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function TimelineBuffered(props, ref) {
  const store = usePlayerStore();
  const element = useStore(store.element);
  const duration = useStore(store.duration);
  const [end, setEnd] = useState(0);

  useEffect(() => {
    if (!element) return;
    // A new number only when the range grows: `timeupdate` and the rest
    // usually find the same end, and React skips the render.
    const update = () => setEnd(bufferedEnd(element));
    update();
    for (const type of EVENTS) element.addEventListener(type, update);
    return () => {
      for (const type of EVENTS) element.removeEventListener(type, update);
    };
  }, [element]);

  const fraction = duration > 0 ? Math.min(end / duration, 1) : 0;

  return (
    <>
      <style {...hoisted}>{bufferedRules}</style>
      <div
        data-part="buffered"
        {...props}
        ref={ref}
        style={
          {
            ...bufferedStyles,
            "--buffered": String(fraction),
            ...props.style,
          } as React.CSSProperties
        }
      />
    </>
  );
});
