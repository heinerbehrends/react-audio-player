import { describe, it, expect, vi, afterEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import {
  PlayerStoreProvider,
  usePlayerStore,
} from "../../src/store/PlayerStoreContext";
import { useStore } from "../../src/store/atom";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePlayerStore", () => {
  it("throws without a provider, rather than handing back a dead default", () => {
    // React logs the error boundary-less throw; the assertion is the throw.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => usePlayerStore())).toThrow(
      /must be used within a PlayerStoreProvider/,
    );
  });

  it("returns the store inside a provider", () => {
    const { result } = renderHook(() => usePlayerStore(), {
      wrapper: PlayerStoreProvider,
    });

    expect(result.current.loadState.get()).toBe("loading");
    expect(typeof result.current.attach).toBe("function");
    expect(typeof result.current.send).toBe("function");
  });

  it("keeps the same store across re-renders", () => {
    const { result, rerender } = renderHook(() => usePlayerStore(), {
      wrapper: PlayerStoreProvider,
    });
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it("gives each provider its own store", () => {
    const stores: unknown[] = [];
    function Probe() {
      stores.push(usePlayerStore());
      return null;
    }

    render(
      <>
        <PlayerStoreProvider>
          <Probe />
        </PlayerStoreProvider>
        <PlayerStoreProvider>
          <Probe />
        </PlayerStoreProvider>
      </>,
    );

    expect(stores).toHaveLength(2);
    expect(stores[0]).not.toBe(stores[1]);
  });

  it("does not re-render subscribers when the provider re-renders", () => {
    let renders = 0;
    function Probe() {
      renders += 1;
      const store = usePlayerStore();
      return <span>{useStore(store.loadState)}</span>;
    }
    function Host({ label }: { label: string }) {
      return (
        <PlayerStoreProvider>
          <span>{label}</span>
          <Probe />
        </PlayerStoreProvider>
      );
    }

    const { rerender } = render(<Host label="a" />);
    const rendersBefore = renders;
    rerender(<Host label="b" />);

    // The context value never changes, so the only re-render is the parent
    // re-rendering its children.
    expect(renders).toBe(rendersBefore + 1);
  });
});
