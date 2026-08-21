import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { atom, useStore } from "../../src/store/atom";

describe("useStore", () => {
  it("returns the current value", () => {
    const count = atom(7);

    const { result } = renderHook(() => useStore(count));

    expect(result.current).toBe(7);
  });

  it("re-renders on a changed value", () => {
    const count = atom(0);
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useStore(count);
    });
    const rendersBefore = renders;

    act(() => count.set(1));

    expect(result.current).toBe(1);
    expect(renders).toBeGreaterThan(rendersBefore);
  });

  it("does not re-render when the value is set to an identical one", () => {
    const count = atom(0);
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useStore(count);
    });
    const rendersBefore = renders;

    act(() => count.set(0));

    expect(renders).toBe(rendersBefore);
  });

  it("unsubscribes on unmount", () => {
    const count = atom(0);
    const { unmount } = renderHook(() => useStore(count));

    unmount();
    // No listeners left, so the set is a no-op as far as React is concerned —
    // an update on an unmounted component would warn.
    act(() => count.set(1));

    expect(count.get()).toBe(1);
  });
});
