import { AudioContextProvider } from "../AudioElement/AudioContextProvider";
import { AudioElement } from "../AudioElement/AudioElement";
import { PlayerStoreProvider } from "../store/PlayerStoreContext";
import { PlayerConfigProvider, type AudioFile } from "./PlayerConfigContext";
import type { KeyToActionMap } from "../KeyboardControls/handleMediaKeys";

type AudioPlayerProps = {
  children: React.ReactNode;
  audioFiles: AudioFile[];
  customKeyboardShortcuts?: KeyToActionMap;
};

export function AudioPlayer({
  children,
  audioFiles,
  customKeyboardShortcuts,
}: AudioPlayerProps) {
  return (
    <PlayerStoreProvider>
      <PlayerConfigProvider
        audioFiles={audioFiles}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        <AudioContextProvider>
          <AudioElement />
          {children}
        </AudioContextProvider>
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}
