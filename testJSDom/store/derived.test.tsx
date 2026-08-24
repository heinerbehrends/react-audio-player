import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import {
  useIsDisabled,
  usePlayerState,
  useVolumeState,
} from "../../src/store/derived";
import { createTestStore, type TestStore } from "./createTestStore";
import type { MediaFields } from "./mediaElementFake";

function renderDerived<T>(hook: () => T, element: Partial<MediaFields> = {}) {
  const harness = createTestStore(element);
  const result = renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        {children}
      </PlayerStoreProvider>
    ),
  });
  return { ...result, ...harness };
}

/** Assign a field on the fake, then emit the event a browser would. */
function drive(
  harness: TestStore,
  event: string,
  fields: Partial<MediaFields>,
) {
  act(() => {
    Object.assign(harness.element, fields);
    harness.element.emit(event);
  });
}

describe("usePlayerState", () => {
  it("reports 'loading' before metadata, whatever paused says", () => {
    const { result } = renderDerived(usePlayerState, {
      readyState: 0,
      paused: false,
    });
    expect(result.current).toBe("loading");
  });

  it("reports 'error' when the element carries one", () => {
    const { result } = renderDerived(usePlayerState, {
      error: {} as MediaError,
    });
    expect(result.current).toBe("error");
  });

  it("reports 'paused' and 'playing' off `paused` once ready", () => {
    const harness = renderDerived(usePlayerState, { readyState: 1 });
    expect(harness.result.current).toBe("paused");

    drive(harness, "play", { paused: false });
    expect(harness.result.current).toBe("playing");

    drive(harness, "pause", { paused: true });
    expect(harness.result.current).toBe("paused");
  });

  it("stays correct across a src swap while playing", () => {
    const harness = renderDerived(usePlayerState, {
      readyState: 1,
      paused: false,
    });
    expect(harness.result.current).toBe("playing");

    // The media load algorithm pauses the element without firing `pause`, and
    // fires `emptied` — which re-primes rather than toggling.
    drive(harness, "emptied", { paused: true, readyState: 0 });
    expect(harness.result.current).toBe("loading");
  });
});

describe("useVolumeState", () => {
  it("is 'muted' whenever the element is muted, whatever the volume", () => {
    const { result } = renderDerived(useVolumeState, {
      muted: true,
      volume: 1,
    });
    expect(result.current).toBe("muted");
  });

  it("is 'muted' for a volume a hair off zero", () => {
    const { result } = renderDerived(useVolumeState, { volume: 0.0005 });
    expect(result.current).toBe("muted");
  });

  it("switches from 'low' to 'high' at 0.5", () => {
    const harness = renderDerived(useVolumeState, { volume: 0.4 });
    expect(harness.result.current).toBe("low");

    drive(harness, "volumechange", { volume: 0.49 });
    expect(harness.result.current).toBe("low");

    drive(harness, "volumechange", { volume: 0.5 });
    expect(harness.result.current).toBe("high");

    drive(harness, "volumechange", { volume: 0.6 });
    expect(harness.result.current).toBe("high");
  });
});

describe("useIsDisabled", () => {
  it("is true while loading and on error, false once ready", () => {
    const harness = renderDerived(useIsDisabled, { readyState: 0 });
    expect(harness.result.current).toBe(true);

    drive(harness, "loadedmetadata", { readyState: 1 });
    expect(harness.result.current).toBe(false);

    drive(harness, "error", { error: {} as MediaError });
    expect(harness.result.current).toBe(true);
  });
});
