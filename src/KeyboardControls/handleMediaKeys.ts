import { useLabels, usePlayerConfig } from "../Player/PlayerConfigContext";
import { composeEventHandlers } from "../Shared/composeEventHandlers";
import type {
  KeyboardAction,
  SideEffectAction,
} from "../AudioElement/sideEffectActions";
import { usePlayerStore } from "../store/PlayerStoreContext";

export type HandleMediaKeysArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  handleSideEffect: (action: SideEffectAction) => void;
  customKeyboardShortcuts: KeyToActionMap | undefined;
};

/**
 * Keys to the action they perform, merged over `defaultKeyToActionMap`.
 *
 * `null` unbinds: `{ p: null }` drops the default binding and lets `p` through
 * to the browser. That is how a shortcut is turned off, player-wide.
 */
export type KeyToActionMap = {
  [key: string]: KeyboardAction | null;
};

export const defaultKeyToActionMap: KeyToActionMap = {
  p: { type: "TOGGLE_PLAY" },
  P: { type: "TOGGLE_PLAY" },
  k: { type: "TOGGLE_PLAY" },
  K: { type: "TOGGLE_PLAY" },
  MediaPlayPause: { type: "TOGGLE_PLAY" },
  // Space is deliberately absent. Every control this handler is attached to is
  // a <button>, and mapping Space here would `preventDefault()` its native
  // activation, so Space would start playback instead of pressing the focused
  // button. `p` and `k` cover play/pause, and a consumer who wants Space can
  // add it through `customKeyboardShortcuts`.
  s: { type: "STOP_AUDIO" },
  S: { type: "STOP_AUDIO" },
  MediaStop: { type: "STOP_AUDIO" },
  m: { type: "TOGGLE_MUTE" },
  M: { type: "TOGGLE_MUTE" },
  MediaMute: { type: "TOGGLE_MUTE" },
  l: { type: "SET_TIME_FORWARD", value: 10 },
  L: { type: "SET_TIME_FORWARD", value: 10 },
  ArrowRight: { type: "SET_TIME_FORWARD", value: 5 },
  ArrowLeft: { type: "SET_TIME_BACKWARD", value: 5 },
  MediaVolumeUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowUp: { type: "INCREASE_VOLUME", value: 0.025 },
  ArrowDown: { type: "DECREASE_VOLUME", value: 0.025 },
  MediaVolumeDown: { type: "DECREASE_VOLUME", value: 0.025 },
  j: { type: "SET_TIME_BACKWARD", value: 10 },
  J: { type: "SET_TIME_BACKWARD", value: 10 },
  ">": { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
  "<": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  "]": { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
  "[": { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
  Backspace: { type: "RESET_PLAYBACK_RATE" },
  "0": { type: "SET_TIME_TO_START" },
  "1": { type: "SET_TIME_TO_PERCENT", percent: 0.1 },
  "2": { type: "SET_TIME_TO_PERCENT", percent: 0.2 },
  "3": { type: "SET_TIME_TO_PERCENT", percent: 0.3 },
  "4": { type: "SET_TIME_TO_PERCENT", percent: 0.4 },
  "5": { type: "SET_TIME_TO_PERCENT", percent: 0.5 },
  "6": { type: "SET_TIME_TO_PERCENT", percent: 0.6 },
  "7": { type: "SET_TIME_TO_PERCENT", percent: 0.7 },
  "8": { type: "SET_TIME_TO_PERCENT", percent: 0.8 },
  "9": { type: "SET_TIME_TO_PERCENT", percent: 0.9 },
};

export function handleMediaKeys(args: HandleMediaKeysArgs) {
  const { event, handleSideEffect, customKeyboardShortcuts } = args;

  // Modifier combinations belong to the browser and to assistive technology:
  // `Ctrl+Option+Arrow` is VoiceOver's own navigation, and swallowing it makes
  // the player unusable with a screen reader. Shift is not checked, because
  // `<` and `>` in the default map are shifted keys.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  const keyToActionMap = {
    ...defaultKeyToActionMap,
    ...customKeyboardShortcuts,
  };
  const action = keyToActionMap[event.key];

  if (!action) return false;

  handleSideEffect(action);
  event.preventDefault();
  return true;
}

// `store.send` has a permanent identity, so the returned handler needs no
// `useCallback`.
export function useHandleMediaKeys() {
  const { customKeyboardShortcuts } = usePlayerConfig();
  const { send } = usePlayerStore();

  return (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const result = handleMediaKeys({
      event,
      handleSideEffect: send,
      customKeyboardShortcuts,
    });

    if (result) {
      event.stopPropagation();
    }

    return result;
  };
}

/**
 * The player's keyboard shortcuts as an `onKeyDown` handler, for controls of
 * your own. Put it on one element, or on a container to cover every control
 * inside it: a key a library control already handled stops there, so nothing
 * runs twice. Keys typed into a text field, `<select>` or `contenteditable`
 * are left alone.
 *
 * Follows `customKeyboardShortcuts`, like every library control.
 *
 * @example
 * ```jsx
 * const onKeyDown = useMediaKeyHandler();
 * <div className="player" onKeyDown={onKeyDown}>…</div>
 * ```
 */
export function useMediaKeyHandler() {
  const handleMediaKeys = useHandleMediaKeys();
  // Only here: no library control is editable, so they skip the check.
  return (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (
      !target.isContentEditable &&
      !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
    ) {
      handleMediaKeys(event as React.KeyboardEvent<HTMLButtonElement>);
    }
  };
}

/**
 * Props for the element that holds your player: a named landmark that clicks
 * focus, with the keyboard shortcuts on everything inside it.
 *
 * - `role="region"` and `aria-label`, from `labels.player`, so two players
 *   on a page announce apart (A10). Pass `aria-labelledby` to name it by the
 *   track title instead.
 * - `tabIndex={-1}`: a click on the cover or the title focuses the player, so
 *   the shortcuts work, without adding a tab stop. Keyboard users reach it
 *   through its controls.
 * - `onKeyDown` from `useMediaKeyHandler`, composed after your own. Space
 *   also plays and pauses while the container itself has focus; on a button
 *   inside, it presses the button. A `" "` in `customKeyboardShortcuts` wins.
 *
 * Spread it onto your container, passing your own props in the call.
 *
 * @example
 * ```jsx
 * <div {...usePlayerRootProps({ className: "player" })}>…</div>
 * ```
 */
export function usePlayerRootProps<P extends React.HTMLAttributes<HTMLElement>>(
  props?: P,
) {
  const labels = useLabels();
  const { customKeyboardShortcuts } = usePlayerConfig();
  const { send } = usePlayerStore();
  const onKeyDown = useMediaKeyHandler();
  return {
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
