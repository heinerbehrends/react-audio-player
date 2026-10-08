import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { renderInPlayer } from "../testComponents";
import {
  alongTrack,
  pointerEventAt,
  stubElementRects,
  stubResizeObserver,
} from "../testUtils";

describe("PlaybackRateSlider", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("should export all subcomponents", () => {
    expect(PlaybackRateSlider.Background).toBeDefined();
    expect(PlaybackRateSlider.Progress).toBeDefined();
    expect(PlaybackRateSlider.Control).toBeDefined();
    expect(PlaybackRateSlider.Thumb).toBeDefined();
  });

  // S12: `Thumb` is `position: absolute`, so without this on the root its
  // containing block is whichever ancestor happens to be positioned.
  it("positions its root, so the thumb resolves against it", () => {
    renderInPlayer(
      <PlaybackRateSlider data-testid="root">
        <PlaybackRateSlider.Control>Set</PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("root")).toHaveStyle({ position: "relative" });
  });

  it("renders Set with the slider semantics", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { element: { playbackRate: 1 } },
    );

    const set = screen.getByTestId("set");
    expect(set).toHaveAttribute("role", "slider");
    expect(set).toHaveAttribute("aria-label", "Playback rate slider");
    expect(set).toHaveAttribute("aria-valuetext", "1x");
  });

  it("defaults to a 0.5 to 4 range", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemin", "0.5");
    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemax", "4");
  });

  // F15: the range is the player's, so the slider has no range props.
  it("takes its range from the player's rateRange", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { rateRange: [1, 2] },
    );

    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemin", "1");
    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemax", "2");
  });

  it("follows a later change to the range", () => {
    const { store, rerender } = renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
    );

    act(() => store.setRateRange([0.75, 3]));
    rerender(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemin", "0.75");
    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemax", "3");
  });

  it("renders Progress from the rate", () => {
    const { container } = renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
        <PlaybackRateSlider.Progress data-testid="progress" />
      </PlaybackRateSlider>,
      { element: { playbackRate: 1.5 }, rateRange: [0.5, 2.5] },
    );

    // Half way between 0.5 and 2.5. The fill draws from this (S28).
    const root = container.querySelector('[data-part="root"]') as HTMLElement;
    expect(root.style.getPropertyValue("--progress")).toBe("0.5");
    expect(screen.getByTestId("progress").style.transform).toBe("");
  });

  // S29: a rate written past the range through `audioRef` still draws a full
  // fill rather than one past the end of the track.
  it("clamps --progress for a rate past the range's maximum", () => {
    const { container } = renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { element: { playbackRate: 8 } },
    );

    const root = container.querySelector('[data-part="root"]') as HTMLElement;
    expect(root.style.getPropertyValue("--progress")).toBe("1");
  });

  it("renders Background with the progress styles", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control />
        <PlaybackRateSlider.Background data-testid="background" />
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("background")).toHaveStyle({
      gridColumn: "1 / 1",
      gridRow: "1 / 1",
      width: "100%",
      height: "100%",
    });
  });

  it("renders Drag out of the tab order", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control />
        <PlaybackRateSlider.Thumb data-testid="drag" />
      </PlaybackRateSlider>,
    );

    const drag = screen.getByTestId("drag");
    expect(drag).toHaveAttribute("aria-hidden", "true");
    expect(drag).toHaveAttribute("tabindex", "-1");
  });

  it("snaps a press on the track to the step", () => {
    const { element } = renderInPlayer(
      <PlaybackRateSlider step={0.1}>
        <PlaybackRateSlider.Control data-testid="set">
          track
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { element: { playbackRate: 1 }, rateRange: [0.5, 2] },
    );

    fireEvent(
      screen.getByTestId("set"),
      pointerEventAt("pointerdown", alongTrack(0.5)),
    );

    expect(element.playbackRate).toBeCloseTo(1.3, 5);
  });

  it("should integrate all components together", () => {
    renderInPlayer(
      <PlaybackRateSlider>
        <PlaybackRateSlider.Control data-testid="set">
          <PlaybackRateSlider.Progress data-testid="progress" />
          <PlaybackRateSlider.Background data-testid="background" />
        </PlaybackRateSlider.Control>
        <PlaybackRateSlider.Thumb data-testid="drag" />
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("set")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });
});
