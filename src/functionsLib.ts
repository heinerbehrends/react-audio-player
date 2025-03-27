type CalculateTimeArgs = {
  xOffset: number;
  sliderLength: number;
  sliderStart: number;
  duration: number;
};

export function calculateTime({
  xOffset,
  sliderLength,
  sliderStart,
  duration,
}: CalculateTimeArgs): number {
  const progress = (xOffset - sliderStart) / sliderLength;
  return progress * duration;
}

type CalculateVolumeArgs = {
  xOffset: number;
  sliderLength: number;
  sliderStart: number;
};

export function calculateVolumeDragEnd({
  xOffset,
  sliderLength,
  sliderStart,
}: CalculateVolumeArgs): number {
  return (xOffset - sliderStart) / sliderLength;
}

export function calculateVolume({
  xOffset,
  sliderLength,
}: Omit<CalculateVolumeArgs, "sliderStart">): number {
  const progress = xOffset / sliderLength;
  return Math.max(0, Math.min(1, progress));
}
