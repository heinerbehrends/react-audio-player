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
   * the start. This is the hook for a playlist: hold the index in your own
   * state and advance it here.
   *
   * A callback rather than a projected `ended` atom, because the element is
   * rewound on `ended` (see `AudioElement`), which clears `el.ended` within a
   * tick — a state would flicker, and advancing a playlist wants the edge, not
   * the level.
   */
  onEnded?: () => void;
};

export function AudioPlayer({
  children,
  audioFile,
  customKeyboardShortcuts,
  onEnded,
}: AudioPlayerProps) {
  return (
    <PlayerStoreProvider>
      <PlayerConfigProvider
        audioFile={audioFile}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        <AudioElement onEnded={onEnded} />
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}
