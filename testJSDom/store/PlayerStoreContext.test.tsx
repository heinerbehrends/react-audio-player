import { describe, it, expect, vi, afterEach } from "vitest";
import { render, renderHook } from "@testing-library/react";
import {
  PlayerStoreProvider,
  usePlayerStore,
} from "../../src/store/PlayerStoreContext";
import { useStore } from "../../src/store/atom";
import { createPlayerStore } from "../../src/store/createPlayerStore";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePlayerStore", () => {
  it("throws without a provider, rather than handing back a dead default", () => {
    // React logs the error boundary-less throw; the assertion is the throw.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => usePlayerStore())).toThrow(
      /must be rendered inside an <AudioPlayer>/,
    );
  });

  it("returns the store inside a provider", () => {
    const { result } = renderHook(() => usePlayerStore(), {
      wrapper: PlayerStoreProvider,
    });

    expect(result.current.loadState.get()).toBe("loading");
    expect(typeof result.current.attach).toBe("function");
    expect(typeof result.current.controls.play).toBe("function");
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

  it("follows a change to the rateRange prop", () => {
    function Probe() {
      const { minValue, maxValue } = useStore(usePlayerStore().rateRange);
      return <span data-testid="range">{`${minValue}–${maxValue}`}</span>;
    }

    const { rerender, getByTestId } = render(
      <PlayerStoreProvider rateRange={[0.5, 2]}>
        <Probe />
      </PlayerStoreProvider>,
    );
    expect(getByTestId("range").textContent).toBe("0.5–2");

    rerender(
      <PlayerStoreProvider rateRange={[0.75, 3]}>
        <Probe />
      </PlayerStoreProvider>,
    );
    expect(getByTestId("range").textContent).toBe("0.75–3");
  });

  it("leaves an injected store's range alone", () => {
    const store = createPlayerStore({ rateRange: [1, 2] });

    render(
      <PlayerStoreProvider store={store}>
        <span />
      </PlayerStoreProvider>,
    );

    expect(store.rateRange.get()).toEqual({ minValue: 1, maxValue: 2 });
  });
});
