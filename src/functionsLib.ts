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
  timelineLeft: number;
};

export function calculateVolumeDragEnd({
  xOffset,
  timelineWidth,
  timelineLeft,
}: CalculateVolumeArgs): number {
  return (xOffset - timelineLeft) / timelineWidth;
}

export function calculateVolume({
  xOffset,
  timelineWidth,
}: Omit<CalculateVolumeArgs, "timelineLeft">): number {
  const progress = (xOffset / timelineWidth);
  return Math.max(0, Math.min(1, progress));
}
