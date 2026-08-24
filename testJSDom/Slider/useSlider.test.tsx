import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { useSlider, type UseSliderOptions } from "../../src/Slider/useSlider";
import { createTestStore, type TestStore } from "../store/createTestStore";
import type { MediaFields } from "../store/mediaElementFake";

/**
 * `useSlider` is the only genuinely new logic in this phase with no existing test
 * to inherit, so its suite lands before the three wrappers are migrated onto it.
 */

const TRACK_START = 100;
const TRACK_LENGTH = 200;

/**
 * jsdom gives every element a zero-sized rect, so the geometry has to be stubbed
 * — the measurement is the one thing here that a jsdom test cannot observe for
 * real.
 */
function stubRect(overrides: Partial<DOMRect> = {}) {
  return {
    left: TRACK_START,
    top: TRACK_START,
    width: TRACK_LENGTH,
    height: TRACK_LENGTH,
    right: TRACK_START + TRACK_LENGTH,
    bottom: TRACK_START + TRACK_LENGTH,
    x: TRACK_START,
    y: TRACK_START,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

function sliderElement(rect = stubRect()) {
  const element = document.createElement("button");
  element.getBoundingClientRect = () => rect;
  return element;
}

type Harness = {
  result: { current: ReturnType<typeof useSlider> };
  store: TestStore;
};

function renderSlider(
  options: UseSliderOptions,
  element: Partial<MediaFields> = {},
): Harness {
  const store = createTestStore({ readyState: 1, duration: 100, ...element });
  const { result } = renderHook(() => useSlider(options), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={store.store}>
        <PlayerConfigProvider
          audioFiles={[]}
          customKeyboardShortcuts={undefined}
        >
          {children}
        </PlayerConfigProvider>
      </PlayerStoreProvider>
    ),
  });

  // Measure, as the semantic element's ref callback does on mount.
  act(() => result.current.setSliderRef(sliderElement()));

  return { result, store };
}

/** A pointer event on the track, at a fraction along it. */
function trackPointer(fraction: number) {
  return {
    clientX: TRACK_START + TRACK_LENGTH * fraction,
    clientY: TRACK_START + TRACK_LENGTH * fraction,
    currentTarget: { getBoundingClientRect: () => stubRect() },
  } as unknown as React.PointerEvent<HTMLButtonElement>;
}

/** A pointer event on a 40px thumb, grabbed `grabOffset` px off its centre. */
function thumbPointer(centre: number, grabOffset: number) {
  const rect = stubRect({
    left: centre - 20,
    top: centre - 20,
    width: 40,
    height: 40,
  });
  return {
    clientX: centre + grabOffset,
    clientY: centre + grabOffset,
    currentTarget: { getBoundingClientRect: () => rect },
  } as unknown as React.PointerEvent<HTMLButtonElement>;
}

/**
 * jsdom has no `PointerEvent`. `MouseEvent` carries `clientX` / `clientY` and a
 * listener keys off the type string, so it stands in exactly.
 */
function pointerEvent(type: string, position = 0) {
  return new MouseEvent(type, { clientX: position, clientY: position });
}

function pointerMove(position: number) {
  act(() => void window.dispatchEvent(pointerEvent("pointermove", position)));
}

function pointerUp(position: number) {
  act(() => void window.dispatchEvent(pointerEvent("pointerup", position)));
}

function keyDown(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLButtonElement>;
}

/** Emits a media event, as the browser would after the element was written. */
function echo(store: TestStore, event: string, fields: Partial<MediaFields>) {
  act(() => {
    Object.assign(store.element, fields);
    store.element.emit(event);
  });
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe("the value source", () => {
  it("reads currentTime and the duration in seek mode", () => {
    const { result } = renderSlider({ mode: "seek" }, { currentTime: 30 });

    expect(result.current.value).toBe(30);
    expect(result.current.minValue).toBe(0);
    expect(result.current.maxValue).toBe(100);
  });

  it("reads the volume in volume mode, on a 0 to 1 range", () => {
    const { result } = renderSlider({ mode: "volume" }, { volume: 0.4 });

    expect(result.current.value).toBe(0.4);
    expect(result.current.maxValue).toBe(1);
  });

  it("reads the rate in rate mode, and takes its range from props", () => {
    const { result } = renderSlider(
      { mode: "rate", minValue: 0.5, maxValue: 2, step: 0.1 },
      { playbackRate: 1.5 },
    );

    expect(result.current.value).toBe(1.5);
    expect(result.current.minValue).toBe(0.5);
    expect(result.current.maxValue).toBe(2);
  });

  it("follows the store between renders", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 0 });

    echo(harness.store, "timeupdate", { currentTime: 42 });

    expect(harness.result.current.value).toBe(42);
  });
});

describe("click to set", () => {
  it("writes the element at the clicked fraction of the track", () => {
    const harness = renderSlider({ mode: "seek" });

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.25)));

    expect(harness.store.element.currentTime).toBe(25);
  });

  it("snaps to the step in rate mode", () => {
    const harness = renderSlider({
      mode: "rate",
      minValue: 0.5,
      maxValue: 2,
      step: 0.1,
    });

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.5)));

    expect(harness.store.element.playbackRate).toBeCloseTo(1.3, 5);
  });

  it("mutes when the volume track is clicked at zero", () => {
    const harness = renderSlider({ mode: "volume" }, { volume: 0.8 });

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0)));

    expect(harness.store.element.volume).toBe(0);
    expect(harness.store.element.muted).toBe(true);
  });

  it("unmutes when the volume track is clicked above zero", () => {
    const harness = renderSlider(
      { mode: "volume" },
      { volume: 0, muted: true },
    );

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.5)));

    expect(harness.store.element.volume).toBe(0.5);
    expect(harness.store.element.muted).toBe(false);
  });
});

describe("dragging", () => {
  it("does not write the element mid-drag in seek mode", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(120, 0)));
    pointerMove(TRACK_START + TRACK_LENGTH * 0.75);

    // The display has moved, the element has not.
    expect(harness.result.current.value).toBe(75);
    expect(harness.store.element.currentTime).toBe(10);

    pointerUp(TRACK_START + TRACK_LENGTH * 0.75);
    expect(harness.store.element.currentTime).toBe(75);
  });

  it("writes the element mid-drag in volume mode", () => {
    const harness = renderSlider({ mode: "volume" }, { volume: 0.8 });

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(260, 0)));
    pointerMove(TRACK_START + TRACK_LENGTH * 0.3);

    expect(harness.store.element.volume).toBeCloseTo(0.3, 5);
  });

  it("reports the drag state while a drag is in progress", () => {
    const harness = renderSlider({ mode: "seek" });
    expect(harness.result.current.dragState).toBe("idle");

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(120, 0)));
    expect(harness.result.current.dragState).toBe("dragging");

    pointerUp(150);
    expect(harness.result.current.dragState).toBe("idle");
  });

  it("ends a drag on pointercancel without committing", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(120, 0)));
    pointerMove(TRACK_START + TRACK_LENGTH * 0.9);
    act(() => void window.dispatchEvent(pointerEvent("pointercancel")));

    expect(harness.result.current.dragState).toBe("idle");
    expect(harness.store.element.currentTime).toBe(10);
  });

  /**
   * The invariant the grab-offset composition test asserts on
   * `calculateSliderValue`, here at the level that used to get it wrong: volume
   * and rate mode ignored the offset and jumped on the first move.
   */
  it.each([-15, 0, 15])(
    "starts from the same value for a grab %i px off the thumb centre",
    (grabOffset) => {
      const centre = TRACK_START + TRACK_LENGTH * 0.5;
      const harness = renderSlider({ mode: "volume" }, { volume: 0.5 });

      act(() =>
        harness.result.current.onThumbPointerDown(
          thumbPointer(centre, grabOffset),
        ),
      );

      expect(harness.result.current.value).toBeCloseTo(0.5, 5);
    },
  );

  it.each([-15, 15])(
    "moves by the pointer delta, not the grab offset of %i px",
    (grabOffset) => {
      const centre = TRACK_START + TRACK_LENGTH * 0.5;
      const harness = renderSlider({ mode: "volume" }, { volume: 0.5 });

      act(() =>
        harness.result.current.onThumbPointerDown(
          thumbPointer(centre, grabOffset),
        ),
      );
      // One pixel of real movement is one pixel of value change.
      pointerMove(centre + grabOffset + 1);

      expect(harness.result.current.value).toBeCloseTo(
        0.5 + 1 / TRACK_LENGTH,
        5,
      );
    },
  );
});

describe("retain until the store reports a different value", () => {
  it("holds the committed value until the element echoes back", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.5)));

    // The commit wrote the fake, but no `seeked` has fired, so the atom still
    // holds the pre-seek time. Without the retain rule the display would snap
    // back to 10 here.
    expect(harness.result.current.value).toBe(50);

    echo(harness.store, "seeked", { currentTime: 50 });
    expect(harness.result.current.value).toBe(50);
  });

  it("does not freeze when the element echoes a slightly different value", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.5)));
    expect(harness.result.current.value).toBe(50);

    // A media element is free to snap to a frame boundary rather than land on
    // the exact time it was given.
    echo(harness.store, "seeked", { currentTime: 49.97 });
    expect(harness.result.current.value).toBe(49.97);

    echo(harness.store, "timeupdate", { currentTime: 50.2 });
    expect(harness.result.current.value).toBe(50.2);
  });

  it("holds the value across a drag release too", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(120, 0)));
    pointerMove(TRACK_START + TRACK_LENGTH * 0.8);
    pointerUp(TRACK_START + TRACK_LENGTH * 0.8);

    expect(harness.result.current.dragState).toBe("idle");
    expect(harness.result.current.value).toBe(80);
  });
});

describe("the aria surface", () => {
  it("labels each mode and reports its range", () => {
    expect(renderSlider({ mode: "seek" }).result.current.aria).toMatchObject({
      "aria-label": "Timeline slider",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-orientation": "horizontal",
    });
    expect(renderSlider({ mode: "volume" }).result.current.aria).toMatchObject({
      "aria-label": "Volume slider",
      "aria-valuemax": 1,
    });
    expect(
      renderSlider({ mode: "rate", maxValue: 2 }).result.current.aria,
    ).toMatchObject({
      "aria-label": "Playback rate slider",
      "aria-valuemax": 2,
    });
  });

  /**
   * The 1 Hz guarantee. `value` moves at `timeupdate` rate for the pixels, and
   * the aria attributes must not: assistive technology reads them off the
   * `role="slider"` node through the accessibility tree, focused or not.
   */
  it("holds aria-valuenow at whole seconds while the value moves", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 30 });
    expect(harness.result.current.aria["aria-valuenow"]).toBe(30);

    echo(harness.store, "timeupdate", { currentTime: 30.25 });

    expect(harness.result.current.value).toBe(30.25);
    expect(harness.result.current.aria["aria-valuenow"]).toBe(30);

    echo(harness.store, "timeupdate", { currentTime: 31.1 });
    expect(harness.result.current.aria["aria-valuenow"]).toBe(31);
  });

  it("describes the position in seek mode", () => {
    const harness = renderSlider(
      { mode: "seek" },
      { currentTime: 65, duration: 3661 },
    );

    expect(harness.result.current.aria["aria-valuetext"]).toBe(
      "Position 1:05 of 1:01:01",
    );
  });

  it("describes a percentage in volume mode and a multiplier in rate mode", () => {
    expect(
      renderSlider({ mode: "volume" }, { volume: 0.42 }).result.current.aria[
        "aria-valuetext"
      ],
    ).toBe("42%");
    expect(
      renderSlider({ mode: "rate" }, { playbackRate: 1.2000000000000002 })
        .result.current.aria["aria-valuetext"],
    ).toBe("1.2x");
  });

  it("announces the dragged value rather than the element's last echo", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 10 });

    act(() => harness.result.current.onThumbPointerDown(thumbPointer(120, 0)));
    pointerMove(TRACK_START + TRACK_LENGTH * 0.75);

    expect(harness.result.current.aria["aria-valuenow"]).toBe(75);
  });
});

describe("per-mode arrow keys", () => {
  it("seeks by five seconds in seek mode", () => {
    const harness = renderSlider({ mode: "seek" }, { currentTime: 30 });

    act(() => harness.result.current.onKeyDown(keyDown("ArrowRight")));
    expect(harness.store.element.currentTime).toBe(35);

    act(() => harness.result.current.onKeyDown(keyDown("ArrowLeft")));
    expect(harness.store.element.currentTime).toBe(30);
  });

  it("changes the volume in volume mode, where arrows used to seek", () => {
    const harness = renderSlider({ mode: "volume" }, { volume: 0.5 });

    act(() => harness.result.current.onKeyDown(keyDown("ArrowRight")));
    expect(harness.store.element.volume).toBeCloseTo(0.55, 5);
    expect(harness.store.element.currentTime).toBe(0);

    act(() => harness.result.current.onKeyDown(keyDown("ArrowDown")));
    expect(harness.store.element.volume).toBeCloseTo(0.5, 5);
  });

  /** The rate slider's `role="slider"` ignored arrow keys entirely before this. */
  it("steps the rate in rate mode", () => {
    const harness = renderSlider(
      { mode: "rate", minValue: 0.5, maxValue: 2, step: 0.1 },
      { playbackRate: 1 },
    );

    act(() => harness.result.current.onKeyDown(keyDown("ArrowUp")));
    expect(harness.store.element.playbackRate).toBeCloseTo(1.1, 5);

    act(() => harness.result.current.onKeyDown(keyDown("ArrowLeft")));
    expect(harness.store.element.playbackRate).toBeCloseTo(1, 5);
  });

  it("leaves every other key to the global media shortcuts", () => {
    const harness = renderSlider({ mode: "volume" }, { paused: true });

    act(() => harness.result.current.onKeyDown(keyDown("p")));

    expect(harness.store.element.play).toHaveBeenCalled();
  });
});

describe("vertical orientation", () => {
  it("measures the height and inverts the pointer position", () => {
    const harness = renderSlider({ mode: "volume", orientation: "vertical" });

    expect(harness.result.current.sliderLength).toBe(TRACK_LENGTH);

    // A quarter of the way down the track is three quarters of the value.
    act(() => harness.result.current.onTrackPointerDown(trackPointer(0.25)));

    expect(harness.store.element.volume).toBeCloseTo(0.75, 5);
  });
});
