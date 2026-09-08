/**
 * The slider's arithmetic: pixels to values and back. Pure — nothing here touches
 * the DOM, which is why `pointerPosition.ts` is a separate module.
 */

export type Orientation = "horizontal" | "vertical";

/** Where a slider is on screen, measured from the element that carries it. */
export type SliderGeometry = {
  sliderStart: number;
  sliderLength: number;
};

/** The value space a slider maps that geometry onto. */
export type SliderRange = {
  minValue?: number;
  maxValue?: number;
  step?: number;
  orientation?: Orientation;
};

type CalculateValueArgs = SliderGeometry &
  Omit<SliderRange, "step"> & {
    clientXY: number;
  };

export function calculateValue({
  clientXY,
  sliderLength,
  sliderStart,
  orientation = "horizontal",
  minValue = 0,
  maxValue = 1,
}: CalculateValueArgs): number {
  const normalizedProgress =
    orientation === "horizontal"
      ? (clientXY - sliderStart) / sliderLength
      : 1 - (clientXY - sliderStart) / sliderLength;
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
  if (step === 0) {
    return value;
  }
  const stepsFromMin = Math.round((value - minValue) / step);
  const steppedValue = minValue + stepsFromMin * step;
  return Math.min(Math.max(steppedValue, minValue), maxValue);
}

type CalculateSliderValueArgs = SliderGeometry &
  SliderRange & {
    clientXY: number;
  };

export function calculateSliderValue({
  minValue = 0,
  maxValue = 1,
  step = 0,
  orientation = "horizontal",
  sliderLength,
  sliderStart,
  clientXY,
}: CalculateSliderValueArgs): number {
  const value = calculateValue({
    minValue,
    maxValue,
    orientation,
    sliderLength,
    sliderStart,
    clientXY,
  });
  if (step) {
    return calculateSteppedValue({
      value,
      minValue,
      maxValue,
      step,
    });
  }
  return value;
}

type GetOffsetArgs = Pick<SliderGeometry, "sliderLength"> &
  Omit<SliderRange, "step"> & {
    value: number;
  };

/**
 * The thumb's pixel offset from the start of the track. Vertical counts from the
 * top, so it runs opposite to the value — which is why `getProgress` cannot
 * reuse it.
 */
export function getOffset({
  value,
  sliderLength,
  minValue = 0,
  maxValue = 1,
  orientation = "horizontal",
}: GetOffsetArgs): number {
  const range = maxValue - minValue;
  // `NaN` when `maxValue === minValue` — a live stream, or any player before
  // `loadedmetadata`. `translate(calc(NaNpx - 50%))` is invalid, so the browser
  // drops the transform entirely. Guarded on `progress`, not by returning early:
  // vertical counts from the top, so its minimum is the full length.
  const progress = range === 0 ? 0 : (value - minValue) / range;

  if (orientation === "horizontal") {
    return progress * sliderLength;
  }
  if (orientation === "vertical") {
    return sliderLength - progress * sliderLength;
  }
  return 0;
}
