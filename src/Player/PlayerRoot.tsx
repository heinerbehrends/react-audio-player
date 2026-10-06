/* eslint-disable react-refresh/only-export-components --
   The hook below is what the component is made of; splitting them to keep fast
   refresh would let the two drift. */
import { useMediaKeyHandler } from "../KeyboardControls/handleMediaKeys";
import { composeEventHandlers } from "../Shared/composeEventHandlers";
import { usePlayerStore } from "../store/PlayerStoreContext";
import { useLabels, usePlayerConfig } from "./PlayerConfigContext";

/**
 * The element that holds your player: a named landmark that a click focuses,
 * with the keyboard shortcuts on everything inside it, your own buttons
 * included. Opt-in: `<AudioPlayer>` renders no element of its own (A10).
 *
 * - `role="region"`, named by `labels.player`, so two players on a page
 *   announce apart. Pass `aria-labelledby` to name it by the track title.
 * - `tabIndex={-1}`: a click on the cover or the title focuses the player, so
 *   the shortcuts keep working, without adding a tab stop.
 * - Space plays and pauses while the root itself has focus; on a button inside,
 *   it presses the button. A `" "` in `customKeyboardShortcuts` wins.
 *
 * Carries `data-part="player"`. Render it inside `<AudioPlayer>`.
 *
 * @example
 * ```jsx
 * <AudioPlayer audioFile={track}>
 *   <PlayerRoot className="player">…</PlayerRoot>
 * </AudioPlayer>
 * ```
 */
export function PlayerRoot(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...usePlayerRootProps(props)} />;
}

/**
 * `<PlayerRoot>`'s props, for a container of your own — a `<section>`, or one
 * another component library renders. Spread it onto the element, passing your
 * own props in the call.
 */
export function usePlayerRootProps<P extends React.HTMLAttributes<HTMLElement>>(
  props?: P,
) {
  const labels = useLabels();
  const { customKeyboardShortcuts } = usePlayerConfig();
  const { send } = usePlayerStore();
  const onKeyDown = useMediaKeyHandler();
  return {
    "data-part": "player",
    role: "region",
    "aria-label": labels?.player ?? "audio player",
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
