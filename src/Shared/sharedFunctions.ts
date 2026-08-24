import type { SliderContextType, SliderEvent } from "../Slider/SliderContext";
export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.001;
}

type CalculateValueArgs = Optional<
  Omit<
    SliderContextType,
    | "handleSliderAction"
    | "step"
    | "component"
    | "value"
    | "dragState"
    | "offsetFromMiddle"
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
  SliderContextType,
  | "handleSliderAction"
  | "component"
  | "dragState"
  | "sliderStart"
  | "sliderLength"
  | "orientation"
  | "clientXY"
  | "offsetFromMiddle"
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
  minValue = 0,
  maxValue = 1,
  orientation = "horizontal",
}: Optional<
  Omit<SliderContextType, "handleSliderAction" | "sliderStart">,
  "step" | "minValue" | "maxValue" | "orientation" | "offsetFromMiddle"
>): number {
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
  orientation: "horizontal" | "vertical",
): number {
  if (isTouchEvent(event)) {
    return orientation === "horizontal"
      ? (event.touches[0]?.clientX ?? 0)
      : (event.touches[0]?.clientY ?? 0);
  }
  return orientation === "horizontal" ? event.clientX : event.clientY;
}

function isTouchEvent(
  event: SliderEvent,
): event is React.TouchEvent<HTMLButtonElement> {
  return "touches" in event;
}

/**
 * `M:SS` below an hour, `H:MM:SS` at or above one — `"61:01"` is wrong for
 * hour-plus content, which is ordinary for an audio player.
 *
 * The clamp is a rendering fix, not a live-stream feature: `duration` is `NaN`
 * before metadata and `Infinity` for a stream, and `duration - currentSecond`
 * can go negative, so this used to emit `"NaN:NaN"`, `"Infinity:NaN"` and
 * `"-1:-5"`. A distinct `"--:--"` token for unknown duration is deliberately not
 * here: it only means something beside a timeline that knows it is unbounded, so
 * it ships with live-stream support or not at all.
 */
export function formatTime(time: number) {
  const clamped = Number.isFinite(time) && time > 0 ? time : 0;
  const roundedTime = Math.round(clamped);
  const seconds = roundedTime % 60;
  const totalMinutes = Math.floor(roundedTime / 60);
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (totalMinutes < 60) {
    return `${totalMinutes}:${paddedSeconds}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSeconds}`;
}
