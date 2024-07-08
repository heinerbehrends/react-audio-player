import { AudioPlayerProvider } from "./components/AudioPlayerContext";
import { AudioPlayer } from "./components/AudioPlayer";

export default function App() {
  return (
    <AudioPlayerProvider>
      <AudioPlayer />
    </AudioPlayerProvider>
  );
}
