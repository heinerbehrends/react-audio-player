import { ActorContextProvider } from "./components/ActorContext";
import { AudioPlayer } from "./components/AudioPlayer";

export default function App() {
  return (
    <ActorContextProvider>
      <AudioPlayer />
    </ActorContextProvider>
  );
}
