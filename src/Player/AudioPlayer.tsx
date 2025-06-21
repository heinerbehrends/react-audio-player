import { AudioContextProvider } from "../AudioElement/AudioContextProvider";
import { type AudioFile, PlayerContextProvider } from "./PlayerProvider";
import { AudioElement } from "../AudioElement/AudioElement";
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
    <AudioContextProvider>
      <PlayerContextProvider
        audioFiles={audioFiles}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        <AudioElement />
        {children}
      </PlayerContextProvider>
    </AudioContextProvider>
  );
}
