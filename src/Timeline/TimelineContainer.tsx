import { HTMLAttributes } from "react";
import { useUpdateTime } from "./useUpdateTime";

export function Container({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  useUpdateTime();
  return (
    <div
      {...props}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        width: "100%",
        ...props.style,
      }}
    >
      {children}
    </div>
  );
}
