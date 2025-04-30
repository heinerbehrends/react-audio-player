import { SliderEvent } from "./sliderHooks";

type DragButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  handleKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  handleDragStart: (event: SliderEvent) => void;
  style: React.CSSProperties;
};

export function DragButton({
  handleDragStart,
  handleKeyDown,
  style,
  ...props
}: DragButtonProps) {
  return (
    <button
      {...props}
      style={style}
      onPointerDown={handleDragStart}
      onTouchStart={handleDragStart}
      onKeyDown={handleKeyDown}
    />
  );
}
