import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type AudioPlayerProps = {
  children: React.ReactNode;
  /**
   * The track. Changing `src` swaps it — the browser re-runs resource selection
   * and the player returns to loading — so a playlist is your own state driving
   * this prop, advanced from {@link onEnded}.
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
   * Fired once when the track finishes, after the element has been returned to
   * the start. The hook for a playlist: hold the index in your own state and
   * advance it here.
   *
   * A callback rather than an `ended` atom, because the rewind clears
   * `el.ended` within a tick — a state would flicker, and a playlist wants the
   * edge, not the level.
   */
  onEnded?: () => void;
  /**
   * Forwarded to the underlying `<audio>`: `preload`, `loop`, `controlsList`,
   * `crossOrigin`, and anything else the library does not model.
   *
   * `<track>` captions go through `children`:
   * `audioProps={{ children: <track kind="captions" src="…" default /> }}`.
   *
   * `src` and `onEnded` are excluded — both have dedicated props, and a second
   * way to set either would be two sources of truth.
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
 * **Every other export must be rendered inside one**, hooks included. They read
 * the store through context and throw a named error outside it rather than
 * falling back to dead state.
 *
 * Several players on a page are independent, each with its own store and element.
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
  onEnded,
  audioProps,
  audioRef,
}: AudioPlayerProps) {
  return (
    <PlayerStoreProvider>
      <PlayerConfigProvider
        audioFile={audioFile}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        <AudioElement {...audioProps} onEnded={onEnded} audioRef={audioRef} />
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}
