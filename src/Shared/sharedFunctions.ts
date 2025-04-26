export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

type CalculateValueArgs = {
  xyOffset: number;
  sliderLength: number;
  sliderStart: number;
  orientation?: "horizontal" | "vertical";
  minValue?: number;
  maxValue?: number;
};

export function calculateValue({
  xyOffset,
  sliderLength,
  sliderStart,
  orientation = "horizontal",
  minValue = 0,
  maxValue = 1,
}: CalculateValueArgs): number {
  const normalizedProgress =
    orientation === "horizontal"
      ? (xyOffset - sliderStart) / sliderLength
      : 1 - (xyOffset - sliderStart) / sliderLength;
  const valueRange = maxValue - minValue;
  const mappedValue = minValue + normalizedProgress * valueRange;

  return Math.max(minValue, Math.min(maxValue, mappedValue));
}

type CalculateSteppedValueArgs = {
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
};

export function calculateSteppedValue({
  value,
  minValue,
  maxValue,
  step,
}: CalculateSteppedValueArgs): number {
  const stepsFromMin = Math.round((value - minValue) / step);
  const steppedValue = minValue + stepsFromMin * step;
  return Math.min(Math.max(steppedValue, minValue), maxValue);
}
