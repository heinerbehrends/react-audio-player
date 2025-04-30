import type { HTMLAttributes } from "react";
import { useMemo } from "react";
type SetRelativeButtonProps = HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  handleRef: (element: HTMLButtonElement | null) => void;
  handlePointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
};

export function SetRelativeButton({
  children,
  handleRef,
  handlePointerDown,
  ...props
}: SetRelativeButtonProps) {
  const style = useMemo(
    () => ({
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      width: "100%",
      height: "100%",
      border: "none",
      background: "none",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      display: "grid",
      padding: 0,
      ...props.style,
    }),
    [props.style]
  );

  return (
    <button
      {...props}
      style={style}
      ref={handleRef}
      onPointerDown={handlePointerDown}
      role="slider"
      tabIndex={-1}
    >
      {children}
    </button>
  );
}
