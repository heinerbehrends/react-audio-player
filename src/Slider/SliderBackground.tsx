import { forwardRef, type HTMLAttributes } from "react";
import { backgroundStyles } from "./calculateStyle";

/** The track behind the fill, shared by all three sliders. */
export const SliderBackground = /* @__PURE__ */ forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function SliderBackground(props, ref) {
  return (
    <div
      data-part="background"
      {...props}
      ref={ref}
      style={{ ...backgroundStyles, ...props.style }}
    />
  );
});
