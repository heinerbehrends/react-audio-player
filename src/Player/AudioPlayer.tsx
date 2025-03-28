import { AudioContextProvider } from "../AudioElement/AudioContextProvider";
import { AudioFile, PlayerContextProvider } from "./PlayerProvider";
import { AudioElement } from "../AudioElement/AudioElement";

type AudioPlayerProps = {
  children: React.ReactNode;
  audioFiles: AudioFile[];
};

export function AudioPlayer({ children, audioFiles }: AudioPlayerProps) {
  return (
    <AudioContextProvider>
      <PlayerContextProvider audioFiles={audioFiles}>
        <AudioElement />
        {children}
      </PlayerContextProvider>
    </AudioContextProvider>
  );
}
