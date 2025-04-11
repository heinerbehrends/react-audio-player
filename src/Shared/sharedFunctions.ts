type CalculateTimeArgs = {
  xyOffset: number;
  sliderLength: number;
  sliderStart: number;
  duration: number;
};

export function calculateTime({
  xyOffset,
  sliderLength,
  sliderStart,
  duration,
}: CalculateTimeArgs): number {
  const time = ((xyOffset - sliderStart) / sliderLength) * duration;
  return Math.min(Math.max(time, 0), duration);
}

type CalculateVolumeArgs = {
  xyOffset: number;
  sliderLength: number;
  sliderStart: number;
  orientation: "horizontal" | "vertical";
};

export function calculateVolume({
  xyOffset,
  sliderLength,
  sliderStart,
  orientation,
}: CalculateVolumeArgs): number {
  const progress =
    orientation === "horizontal"
      ? (xyOffset - sliderStart) / sliderLength
      : (sliderLength - (xyOffset - sliderStart)) / sliderLength;
  return Math.max(0, Math.min(1, progress));
}

export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}
