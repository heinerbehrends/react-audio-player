import { PlaybackRateContextType } from "../PlaybackRate/PlaybackRateContext";
import { TimelineContextType } from "../Timeline/TimelineContext";
import { VolumeContextType } from "../Volume/VolumeContext";

type DragButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  context: TimelineContextType | VolumeContextType | PlaybackRateContextType;
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
