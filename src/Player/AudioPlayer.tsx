import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";
import type { PlayerLabels } from "../Shared/playerLabels";

type AudioPlayerProps = {
  children: React.ReactNode;
  /**
   * The track. Changing `src` swaps it and returns the player to loading, so a
   * playlist is your own state driving this prop, advanced from `onEnded`.
   *
   * Safe to pass as an inline literal; nothing memoises on its identity.
   */
  audioFile: AudioFile;
  /**
   * Merged over the default key map: a key you do not name keeps its default.
   *
   * Bound to any focused library control, not to the document.
   */
  customKeyboardShortcuts?: KeyToActionMap;
  /**
   * Your own strings, for every name and readout the library writes. Every entry
   * is optional and falls back to the English default, so a partial bag is fine
   * and passing none changes nothing.
   *
   * A per-instance `aria-label` still wins over the entry for that control.
   *
   * Safe to pass as an inline literal; nothing memoises on its identity, and
   * swapping it re-renders every control — which is how a locale switch works.
   */
  labels?: PlayerLabels;
  /**
   * Fired once when the track finishes, with the element parked at the end.
   *
   * The hook for a playlist. Nothing resumes playback on its own — a `src`
   * change arrives loaded and paused — so call `play()` once the new track
   * reports metadata, or pass `audioProps={{ autoPlay: true }}` and handle a
   * possible autoplay refusal.
   *
   * This is the edge, "the track just finished". For the level, "the position is
   * the end", use `useIsAtEnd()`.
   */
  onEnded?: () => void;
  /**
   * Forwarded to the underlying `<audio>`: `preload`, `loop`, `controlsList`,
   * `crossOrigin`, and anything else the library does not model. `<track>`
   * captions go through its `children`.
   *
   * `src` and `onEnded` are excluded — both have dedicated props.
   */
  audioProps?: Omit<
    React.AudioHTMLAttributes<HTMLAudioElement>,
    "src" | "onEnded"
  >;
  /**
   * A ref to the `<audio>` element, for Web Audio
   * (`createMediaElementSource`), HLS.js/dash.js, or Media Session. Prefer a
   * stable ref: an inline callback re-runs the forwarding effect every render.
   */
  audioRef?: React.Ref<HTMLAudioElement>;
};

/**
 * The player root: the store, the config, and the `<audio>` element. Renders no
 * controls and no wrapper beyond that element — layout is entirely `children`.
 *
 * **Every other export must be rendered inside one**, hooks included; they throw
 * outside it. Several players on a page are independent.
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
