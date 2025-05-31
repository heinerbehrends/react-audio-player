import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDrag } from "../../src/Slider/useDrag";

describe("useDrag", () => {
  it("handles drag state changes", () => {
    const onPointerUp = vi.fn();
    const onPointerMove = vi.fn();
    const onPointerCancel = vi.fn();

    const { rerender } = renderHook(
      ({ dragState }: { dragState: "dragging" | "idle" }) =>
        useDrag({
          dragState,
          onPointerUp,
          onPointerMove,
          onPointerCancel,
        }),
      { initialProps: { dragState: "dragging" } },
    );

    // Test active drag state
    const moveEvent = new MouseEvent("pointermove");
    window.dispatchEvent(moveEvent);
    expect(onPointerMove).toHaveBeenCalledWith(moveEvent);

    // Test inactive drag state
    rerender({ dragState: "idle" as const });
    onPointerMove.mockClear();
    window.dispatchEvent(moveEvent);
    expect(onPointerMove).not.toHaveBeenCalled();
  });
});
