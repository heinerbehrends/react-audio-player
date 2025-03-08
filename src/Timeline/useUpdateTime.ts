import { useEffect, useContext, useRef } from "react";
import { TimelineContext } from "./TimelineContext";
import { PlayerContext } from "../Player/PlayerContext";

export function useUpdateTime() {
  const { dispatch } = useContext(TimelineContext);
  const { element, player } = useContext(PlayerContext);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (player !== "playing" || !element) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      return;
    }

    const updateTime = () => {
      const currentTime = element.currentTime;
      dispatch({ type: "UPDATE_TIME", time: currentTime });
      frameRef.current = requestAnimationFrame(updateTime);
    };

    frameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [player, element, dispatch]);
}
