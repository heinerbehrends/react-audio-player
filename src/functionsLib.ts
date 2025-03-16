type CalculateTimeArgs = {
  xOffset: number;
  timelineWidth: number;
  timelineLeft: number;
  duration: number;
};

export function calculateTime({
  xOffset,
  timelineWidth,
  timelineLeft,
  duration,
}: CalculateTimeArgs): number {
  const progress = (xOffset - timelineLeft) / timelineWidth;
  return progress * duration;
}

type CalculateVolumeArgs = {
  xOffset: number;
  timelineWidth: number;
};

export function calculateVolume({
  xOffset,
  timelineWidth,
}: CalculateVolumeArgs): number {
  return Math.max(0, Math.min(1, xOffset / timelineWidth));
}
