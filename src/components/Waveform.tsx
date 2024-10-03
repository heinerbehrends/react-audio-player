"use client";
import { useEffect, useState } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";

const { useSelector } = AudioPlayerContext;
// add webkitAudioContext to window type
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function normalize(audioData: number[]) {
  const max = Math.max(...audioData);
  return audioData.map((n) => n / max);
}

function WaveformBarChart({ waveform }: { waveform: number[] }) {
  const width = 800; // Original width of the SVG
  const height = 200; // Original height of the SVG
  const barWidth = width / waveform.length; // Width of each bar

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto" }}
    >
      {waveform.map((value, index) => {
        const barHeight = value * height; // Scale the bar height based on the waveform value
        return (
          <rect
            key={index}
            x={index * barWidth}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill="black"
          />
        );
      })}
    </svg>
  );
}

function createWaveform(
  audioData: Float32Array,
  durationInSeconds: number,
  samplePointsPerSecond: number
) {
  // returns an array of length samplePointsPerSecond * durationInSeconds
  // each element is the average of the audioData for that slice of a second
  // returns normalized values
  // return only positive values
  const samples = samplePointsPerSecond * durationInSeconds;
  console.log("samples", samples);
  const sampleSize = Math.floor(audioData.length / samples);
  console.log("sampleSize", sampleSize);
  const waveform = new Array(Math.round(samples)).fill(0).map((_, i) => {
    const start = i * sampleSize;
    const end = start + sampleSize;
    const slice = audioData.subarray(start, end);

    const sum = slice.map(Math.abs).reduce((a, b) => a + b, 0);
    return Math.abs(sum / slice.length);
  });
  console.log("waveform", waveform);
  return normalize(waveform);
}

export function Waveform({
  pointsPerSecond = 2,
}: {
  pointsPerSecond?: number;
}) {
  const { audioClip, ref } = useSelector((state) => ({
    audioClip: state.context.audioClip,
    ref: state.context.ref,
  }));
  const [waveform, setWaveform] = useState<number[]>([]);

  useEffect(() => {
    if (!window) return;
    window.AudioContext = window.AudioContext ?? window.webkitAudioContext;
    const audioContext = new AudioContext();
    const duration = ref?.duration ?? 1;

    async function fetchAudio() {
      try {
        const response = await fetch(`/${audioClip}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const audioData = audioBuffer.getChannelData(0);
        try {
          const waveform = createWaveform(audioData, duration, pointsPerSecond);
          setWaveform(waveform);
        } catch (error) {
          console.error("Error converting audio data:", error);
        }
      } catch (error) {
        console.error("Error fetching or decoding audio data:", error);
      }
    }

    fetchAudio();
  }, [audioClip, ref?.duration]);

  return <WaveformBarChart waveform={waveform} />;
}
