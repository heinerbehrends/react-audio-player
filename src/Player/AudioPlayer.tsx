import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";
import type { PlayerLabels } from "../Shared/playerLabels";

type AudioPlayerProps = {
  /** The player's UI, rendered after the `<audio>` element. */
  children: React.ReactNode;
  /**
   * The track. A new `src` swaps it: a playing player carries on with the new
   * track, a paused one stays paused. An inline literal is fine.
   */
  audioFile: AudioFile;
  /**
   * Shortcuts merged over the defaults. They work on the focused library
   * control, or anywhere inside `<PlayerRoot>`; never page-wide.
   */
  customKeyboardShortcuts?: KeyToActionMap;
  /**
   * Your own strings for every name and readout. Each entry is optional, and a
   * per-instance `aria-label` still wins. An inline literal is fine.
   */
  labels?: PlayerLabels;
  /**
   * Called once when the track plays to its end. Change `audioFile` here to
   * advance a playlist. For the state rather than the event, use `useIsAtEnd()`.
   */
  onEnded?: () => void;
  /**
   * Attributes for the `<audio>` element: `preload`, `loop`, `crossOrigin`,
   * `<track>` children and anything else the library does not model. `src` and
   * `onEnded` have their own props.
   */
  audioProps?: Omit<
    React.AudioHTMLAttributes<HTMLAudioElement>,
    "src" | "onEnded"
  >;
  /**
   * A ref to the `<audio>` element, for Web Audio or HLS.js. Prefer a stable
   * ref; an inline callback re-runs on every render.
   */
  audioRef?: React.Ref<HTMLAudioElement>;
};

/**
 * The player root. Creates the store and renders the `<audio>` element, and no
 * other element: the layout is your `children`. Every other export must be
 * rendered inside one, hooks included; `useIsVolumeAvailable()` is the one
 * exception.
 *
 * @example
 * ```jsx
 * <AudioPlayer audioFile={{ src: "/track.mp3" }}>
 *   <PlayButton>
 *     <PlayButton.Playing>⏸</PlayButton.Playing>
 *     <PlayButton.Paused>▶</PlayButton.Paused>
 *   </PlayButton>
 * </AudioPlayer>
 * ```
 */
export function AudioPlayer({
  children,
  audioFile,
  customKeyboardShortcuts,
  labels,
  onEnded,
  audioProps,
  audioRef,
}: AudioPlayerProps) {
  return (
    <PlayerStoreProvider>
      <PlayerConfigProvider
        audioFile={audioFile}
        customKeyboardShortcuts={customKeyboardShortcuts}
        labels={labels}
      >
        <AudioElement {...audioProps} onEnded={onEnded} audioRef={audioRef} />
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}
