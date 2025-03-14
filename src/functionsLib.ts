export function calculateTime({
  xOffset,
  timelineWidth,
  duration,
}: {
  xOffset: number;
  timelineWidth: number;
  duration: number;
}): number {
  const progress = xOffset / timelineWidth;
  return progress * duration;
}

export function calculateVolume({
  xOffset,
  timelineWidth,
}: {
  xOffset: number;
  timelineWidth: number;
}): number {
  return Math.max(0, Math.min(1, xOffset / timelineWidth));
}
