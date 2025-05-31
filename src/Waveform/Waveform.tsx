"use client";
import { useWaveform } from "./useWaveform";
import { WaveformProvider } from "./WaveformProvider";
import { useWaveformContext } from "./WaveformContext";

// add webkitAudioContext to window type
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

type WaveformBarChartProps = {
  waveform: number[];
} & React.SVGProps<SVGSVGElement>;

export function WaveformBarChart({
  waveform,
  style,
  ...props
}: WaveformBarChartProps) {
  const width = 800;
  const height = 200;
  const pointWidth = width / (waveform.length - 1); // Width between points

  const path = waveform
    .map((value, index) => {
      const x = index * pointWidth;
      const y = height - value * height;
      return `M ${x} ${height} L ${x} ${y} L ${x + pointWidth} ${y} L ${
        x + pointWidth
      } ${height} Z`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", ...style }}
      {...props}
    >
      <path d={path} fill="currentColor" stroke="none" strokeWidth="1" />
    </svg>
  );
}

function WaveformLoading({ children }: { children: React.ReactNode }) {
  const { waveformState } = useWaveformContext();
  if (waveformState !== "loading") return null;
  return <>{children}</>;
}

type WaveformProps = {
  nrOfPoints?: number;
  children?: React.ReactNode;
} & React.SVGProps<SVGSVGElement>;

function WaveformComponent({
  children,
  nrOfPoints = 100,
  style,
  ...props
}: WaveformProps) {
  const { waveform } = useWaveformContext();
  useWaveform(nrOfPoints);

  if (children) {
    return <>{children}</>;
  }
  return (
    <WaveformProvider nrOfPoints={nrOfPoints}>
      <WaveformBarChart waveform={waveform} style={style} {...props} />
    </WaveformProvider>
  );
}

type WaveformType = typeof WaveformComponent & {
  Loading: typeof WaveformLoading;
};

export const Waveform = WaveformComponent as WaveformType;

Waveform.Loading = WaveformLoading;
