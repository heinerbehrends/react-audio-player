// The demo build serves the audio itself; anywhere else, such as a sandbox,
// reads the copy on the deployed demo.
export const AUDIO_BASE: string =
  import.meta.env.VITE_AUDIO_BASE ??
  "https://heinerbehrends.github.io/react-audio-player/";
