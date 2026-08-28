import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
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

  it("takes a range from props", () => {
    renderInPlayer(
      <PlaybackRateSlider minValue={1} maxValue={2}>
        <PlaybackRateSlider.Control data-testid="set">
          Set
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemin", "1");
    expect(screen.getByTestId("set")).toHaveAttribute("aria-valuemax", "2");
  });

  it("renders Progress from the rate", () => {
    renderInPlayer(
      <PlaybackRateSlider minValue={0.5} maxValue={2.5}>
        <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
        <PlaybackRateSlider.Progress data-testid="progress" />
      </PlaybackRateSlider>,
      { element: { playbackRate: 1.5 } },
    );

    // Half way between 0.5 and 2.5.
    expect(screen.getByTestId("progress")).toHaveStyle({
      transform: "scaleX(0.5)",
      transformOrigin: "left",
    });
  });

  it("renders Background with the progress styles", () => {
    renderInPlayer(
      <PlaybackRateSlider>
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
        <PlaybackRateSlider.Thumb data-testid="drag" />
      </PlaybackRateSlider>,
    );

    const drag = screen.getByTestId("drag");
    expect(drag).toHaveAttribute("aria-hidden", "true");
    expect(drag).toHaveAttribute("tabindex", "-1");
  });

  it("snaps a press on the track to the step", () => {
    const { element } = renderInPlayer(
      <PlaybackRateSlider minValue={0.5} maxValue={2} step={0.1}>
        <PlaybackRateSlider.Control data-testid="set">
          track
        </PlaybackRateSlider.Control>
      </PlaybackRateSlider>,
      { element: { playbackRate: 1 } },
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
