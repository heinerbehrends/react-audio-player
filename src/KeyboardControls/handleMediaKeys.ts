import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";
import type {
  AudioPlayerControls,
  AudioPlayerState,
} from "../store/useAudioPlayer";

/**
 * What a shortcut does, given `useAudioPlayer()`'s object as it is when the key
 * is pressed: `({ seekBy }) => seekBy(30)`.
 */
export type Shortcut = (player: AudioPlayerState & AudioPlayerControls) => void;

/**
 * Keys, as `KeyboardEvent.key` values, to what each does. Merged over the
 * default bindings, so a key you leave out keeps its default; `null` unbinds a
 * key and lets it reach the browser. Letters match either case.
 */
export type Shortcuts = {
  [key: string]: Shortcut | null;
};

export type HandleMediaKeysArgs = {
  event: React.KeyboardEvent<HTMLButtonElement>;
  /** The player as the shortcut sees it, read only when a key matches. */
  player: () => AudioPlayerState & AudioPlayerControls;
  shortcuts: Shortcuts | undefined;
};

// Shift+P arrives as `P`: folding letters to one case lets `p: null` unbind
// both, and Caps Lock change nothing. Non-letters, `<` included, are unchanged.
const keyOf = (key: string) => (key.length === 1 ? key.toLowerCase() : key);

const seekToTenth =
  (tenths: number): Shortcut =>
  ({ seek, duration }) =>
    seek((duration * tenths) / 10);

export const defaultShortcuts: Shortcuts = {
  p: ({ toggle }) => toggle(),
  k: ({ toggle }) => toggle(),
  MediaPlayPause: ({ toggle }) => toggle(),
  // Space is deliberately absent. Every control this handler is attached to is
  // a <button>, and mapping Space here would `preventDefault()` its native
  // activation, so Space would start playback instead of pressing the focused
  // button. `p` and `k` cover play/pause, and a consumer who wants Space can
  // add it through `shortcuts`.
  s: ({ stop }) => stop(),
  MediaStop: ({ stop }) => stop(),
  m: ({ toggleMute }) => toggleMute(),
  MediaMute: ({ toggleMute }) => toggleMute(),
  l: ({ seekBy }) => seekBy(10),
  j: ({ seekBy }) => seekBy(-10),
  ArrowRight: ({ seekBy }) => seekBy(5),
  ArrowLeft: ({ seekBy }) => seekBy(-5),
  ArrowUp: ({ adjustVolume }) => adjustVolume(0.025),
  ArrowDown: ({ adjustVolume }) => adjustVolume(-0.025),
  MediaVolumeUp: ({ adjustVolume }) => adjustVolume(0.025),
  MediaVolumeDown: ({ adjustVolume }) => adjustVolume(-0.025),
  ">": ({ adjustRate }) => adjustRate(0.05),
  "<": ({ adjustRate }) => adjustRate(-0.05),
  "]": ({ adjustRate }) => adjustRate(0.05),
  "[": ({ adjustRate }) => adjustRate(-0.05),
  Backspace: ({ setRate }) => setRate(1),
  "0": ({ seek }) => seek(0),
  "1": seekToTenth(1),
  "2": seekToTenth(2),
  "3": seekToTenth(3),
  "4": seekToTenth(4),
  "5": seekToTenth(5),
  "6": seekToTenth(6),
  "7": seekToTenth(7),
  "8": seekToTenth(8),
  "9": seekToTenth(9),
};

export function handleMediaKeys(args: HandleMediaKeysArgs) {
  const { event, player, shortcuts } = args;

  // Modifier combinations belong to the browser and to assistive technology:
  // `Ctrl+Option+Arrow` is VoiceOver's own navigation, and swallowing it makes
  // the player unusable with a screen reader. Shift is not checked, because
  // `<` and `>` in the default map are shifted keys.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  const key = keyOf(event.key);
  let shortcut = defaultShortcuts[key];
  for (const [bound, own] of Object.entries(shortcuts ?? {})) {
    if (keyOf(bound) === key) shortcut = own;
  }

  if (!shortcut) return false;

  shortcut(player());
  event.preventDefault();
  return true;
}

export function useHandleMediaKeys() {
  const { shortcuts } = usePlayerConfig();
  const store = usePlayerStore();

  return (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const result = handleMediaKeys({
      event,
      player: store.read,
      shortcuts,
    });

    if (result) {
      event.stopPropagation();
    }

    return result;
  };
}

/**
 * The shortcuts as an `onKeyDown` for a container, which `usePlayerRootProps`
 * builds on. Keys typed into a text field, `<select>` or `contenteditable`
 * are left alone; no library control is editable, so they skip the check.
 */
export function useMediaKeyHandler() {
  const handleMediaKeys = useHandleMediaKeys();
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
