import { HTMLAttributes } from "react";

export function Container({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div
      {...props}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        width: "100%",
        alignItems: "center",
        ...props.style,
      }}
    >
      {children}
    </div>
  );
}
