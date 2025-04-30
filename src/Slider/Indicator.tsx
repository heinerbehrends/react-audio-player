import { type HTMLAttributes, memo } from "react";

type IndicatorProps = HTMLAttributes<HTMLDivElement>;

export const Indicator = memo(function Indicator({
  style,
  ...props
}: IndicatorProps) {
  return (
    <div
      {...props}
      style={{
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
});

export const IndicatorBackground = memo(function IndicatorBackground({
  style,
  ...props
}: IndicatorProps) {
  return (
    <div
      {...props}
      style={{
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
});
