import { SliderContext } from "./SliderContext";

type DragButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  context: SliderContext;
  handleKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  handleDragStart: () => void;
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
