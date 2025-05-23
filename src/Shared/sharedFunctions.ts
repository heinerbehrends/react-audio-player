import type { SliderContext, SliderEvent } from "../Slider/SliderContext";
export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.001;
}

type CalculateValueArgs = Optional<
  Omit<
    SliderContext,
    "handleSliderAction" | "step" | "component" | "value" | "dragState"
  >,
  "orientation" | "minValue" | "maxValue"
>;

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

type CalculateSteppedValueArgs = Omit<
  SliderContext,
  | "handleSliderAction"
  | "component"
  | "dragState"
  | "sliderStart"
  | "sliderLength"
  | "orientation"
  | "clientXY"
>;

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

type CalculateUiValueArgs = CalculateValueArgs & {
  step?: number | undefined;
};

export function calculateSliderValue({
  minValue = 0,
  maxValue = 1,
  step = 0,
  orientation = "horizontal",
  sliderLength,
  sliderStart,
  clientXY,
}: CalculateUiValueArgs): number {
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

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export function getOffset({
  value,
  sliderLength,
  clientXY,
  dragState,
  minValue = 0,
  maxValue = 1,
  orientation = "horizontal",
  step = 0,
}: Optional<
  Omit<SliderContext, "handleSliderAction" | "sliderStart">,
  "step" | "minValue" | "maxValue" | "orientation"
>): number {
  if (dragState === "dragging" && !step) {
    return clientXY;
  }
  const range = maxValue - minValue;
  const progress = (value - minValue) / range;

  if (orientation === "horizontal") {
    return progress * sliderLength;
  }
  if (orientation === "vertical") {
    return sliderLength - progress * sliderLength;
  }
  return 0;
}

export function getClientXY(
  event: SliderEvent,
  orientation: "horizontal" | "vertical"
): number {
  if (isTouchEvent(event)) {
    return orientation === "horizontal"
      ? event.touches[0]?.clientX ?? 0
      : event.touches[0]?.clientY ?? 0;
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}

function isTouchEvent(
  event: SliderEvent
): event is React.TouchEvent<HTMLButtonElement> {
  return "touches" in event;
}
