import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type AudioPlayerProps = {
  children: React.ReactNode;
  /**
   * The track. Changing `src` swaps it: the browser re-runs resource selection
   * on its own and the player returns to loading, so a playlist is a piece of
   * your own state driving this prop, advanced from {@link onEnded}.
   *
   * Safe to pass as an inline object literal — nothing memoises on its identity.
   */
  audioFile: AudioFile;
  /**
   * Overrides and additions to the default key map, merged over it. A key absent
   * here keeps its default; mapping one to a different action replaces it.
   *
   * Bound to any focused library control, not to the document — see the
   * accessibility notes in the README for which keys are global and which belong
   * to a slider.
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
 * The player root: the store, the static config, and the `<audio>` element
 * itself. Renders no controls and no wrapper of its own beyond that element —
 * layout is entirely `children`.
 *
 * **Every other export in this library must be rendered inside one**, including
 * the hooks. They read the store through context and throw with a named error
 * outside it, rather than falling back to dead state.
 *
 * Several players on a page are independent: each gets its own store and its own
 * element.
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
