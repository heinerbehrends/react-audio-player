import { useContext, useEffect, useRef } from "react";
import { AudioContext as AudioContextReact } from "../AudioElement/AudioContext";
import { PlayerContext } from "../Player/PlayerContext";
import { useWaveformContext } from "./WaveformContext";

export function useWaveform(nrOfPoints: number) {
  console.log("useWaveform", nrOfPoints);
  const { waveform, setWaveform, setWaveformState } = useWaveformContext();
  const {
    audioElementRef: { current: audioElement },
  } = useContext(AudioContextReact);
  const { audioFiles } = useContext(PlayerContext);
  const { src } = audioFiles?.[0] || {};
  const audioContextRef = useRef<AudioContext | null>(null);
  const processedSrcRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!window || !src || processedSrcRef.current === src) return;

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    window.AudioContext = window.AudioContext ?? window.webkitAudioContext;
    const audioContext = new AudioContext({
      latencyHint: "interactive",
      sampleRate: 8000,
    });
    audioContextRef.current = audioContext;
    const duration = audioElement?.duration ?? 1;

    async function fetchAudio() {
      try {
        const response = await fetch(`/${src}`);
        const arrayBuffer = await response.arrayBuffer();

        if (processedSrcRef.current !== src) {
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }

          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0);
          const pointsPerSecond = nrOfPoints / duration;

          try {
            const waveform = createWaveform(
              audioData,
              duration,
              pointsPerSecond,
            );
            console.log("waveform", waveform);
            setWaveform(waveform);
            processedSrcRef.current = src;
          } catch (error) {
            console.error("Error converting audio data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching or decoding audio data:", error);
      }
    }

    fetchAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [src, audioElement?.duration, nrOfPoints, waveform, setWaveform]);

  setWaveformState("ready");
  setWaveform(waveform);
}

function createWaveform(
  audioData: Float32Array,
  durationInSeconds: number,
  samplePointsPerSecond: number,
) {
  const samples = samplePointsPerSecond * durationInSeconds;
  const sampleSize = Math.floor(audioData.length / samples);

  const waveform = new Array(Math.round(samples)).fill(0).map((_, i) => {
    const start = i * sampleSize;
    const end = start + sampleSize;
    const slice = audioData.subarray(start, end);

    let sum = 0;
    for (let j = 0; j < slice.length; j++) {
      sum += Math.abs(slice[j] ?? 0);
    }
    return sum / slice.length;
  });

  return normalize(waveform);
}

function normalize(audioData: number[]) {
  const max = Math.max(...audioData);
  return audioData.map((n) => n / max);
}
