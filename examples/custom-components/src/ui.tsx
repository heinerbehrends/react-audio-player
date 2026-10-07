import "./ui.css";

// Your own components, such as a design system's: they know nothing about audio.
// The player's behaviour arrives through the props spread onto them.

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
  shape?: "pill" | "circle";
};

export function Button({
  variant = "ghost",
  shape = "pill",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={["ui-button", `ui-${variant}`, `ui-${shape}`, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

type SliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  label: string;
  value: number;
  min?: number;
  max: number;
  onValueChange: (value: number) => void;
  /** What a screen reader announces instead of the bare number. */
  valueText?: string;
};

export function Slider({
  label,
  value,
  min = 0,
  max,
  onValueChange,
  valueText,
  className,
  style,
  ...props
}: SliderProps) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      aria-label={label}
      aria-valuetext={valueText}
      min={min}
      max={max}
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.valueAsNumber)}
      {...props}
      className={["ui-slider", className].filter(Boolean).join(" ")}
      style={{ ...style, "--ui-fill": `${fill}%` } as React.CSSProperties}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={["ui-card", className].filter(Boolean).join(" ")}
    />
  );
}
