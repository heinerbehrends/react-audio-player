/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { forwardRef } from "react";
import { useMediaKeyHandler } from "../KeyboardControls/handleMediaKeys";
import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels, usePlayerConfig } from "./PlayerConfigContext";

/**
 * A container for the player. Renders a `<div role="region">` named by
 * `audioFile.title`, or by `labels.player` without one, with the keyboard
 * shortcuts on everything inside it, your own buttons included. It has
 * `tabIndex={-1}`, so a click on it focuses the player without adding a tab
 * stop, and Space plays and pauses while it has focus. Carries
 * `data-part="player"`.
 */
export const PlayerRoot = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function PlayerRoot(props, ref) {
  return <div {...usePlayerRootProps(props)} ref={ref} />;
});

/**
 * `<PlayerRoot>`'s props for a container of your own. Pass your props in the
 * call and spread the result onto the element.
 */
export function usePlayerRootProps<P extends React.HTMLAttributes<HTMLElement>>(
  props?: P,
) {
  const labels = useLabels();
  const { audioFile, customKeyboardShortcuts } = usePlayerConfig();
  const { send } = usePlayerStore();
  const onKeyDown = useMediaKeyHandler();
  return {
    "data-part": "player",
    role: "region",
    // The title first: `labels` is shared by every player on a page.
    "aria-label": audioFile.title ?? labels?.player ?? "audio player",
    tabIndex: -1,
    ...props,
    onKeyDown: composeEventHandlers(
      props?.onKeyDown,
      (event: React.KeyboardEvent) => {
        // Space presses a focused button (A1), so it is bound only here, where
        // the focus is on the container and Space would only scroll the page.
        if (
          event.key === " " &&
          event.target === event.currentTarget &&
          !(customKeyboardShortcuts && " " in customKeyboardShortcuts) &&
          !(event.ctrlKey || event.metaKey || event.altKey)
        ) {
          send({ type: "TOGGLE_PLAY" });
          event.preventDefault();
          return;
        }
        onKeyDown(event);
      },
    ),
  };
}
