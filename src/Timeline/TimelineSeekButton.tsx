import type { HTMLAttributes } from "react";
import { TimelineContextAction } from "./TimelineContext";
import { useContext, useRef } from "react";
import { TimelineContext } from "./TimelineContext";

export function TimelineSeekButton({
  children,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { dispatch } = useContext(TimelineContext);
  const hasSentDimensions = useRef(false);
  return (
    <button
      {...props}
      style={{
        width: "100%",
        height: "100%",
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        padding: 0,
        margin: 0,
        border: "none",
        background: "none",
        ...props.style,
      }}
      ref={(element) =>
        sendTimelineLoaded({ element, dispatch, hasSentDimensions })
      }
      data-testid="timeline"
      //   onKeyDown={(event) =>
      //     handleTimelineKeys({ event, currentTime, duration, dispatch })
      //   }
      onPointerDown={(event) =>
        dispatch({
          type: "SEEK",
          clientX: event.clientX,
        })
      }
    >
      {children}
    </button>
  );
}
function sendTimelineLoaded({
  element,
  dispatch,
  hasSentDimensions,
}: SendTimelineLoadedProps) {
  if (!element) {
    return;
  }
  if (hasSentDimensions.current) {
    return;
  }
  const rect = element.getBoundingClientRect();
  dispatch({
    type: "TIMELINE_LOADED",
    timelineLeft: rect.left,
    timelineWidth: rect.width,
  });
  hasSentDimensions.current = true;
}

type SendTimelineLoadedProps = {
  element: HTMLButtonElement | null;
  dispatch: (action: TimelineContextAction) => void;
  hasSentDimensions: React.MutableRefObject<boolean>;
};
