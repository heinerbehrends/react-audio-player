import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type AudioPlayerProps = {
  children: React.ReactNode;
  audioFile: AudioFile;
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
