import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { renderInPlayer } from "../testComponents";
import {
  alongTrack,
  pointerEventAt,
  stubElementRects,
  stubResizeObserver,
} from "../testUtils";

describe("Timeline", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("should export all subcomponents", () => {
    expect(Timeline.Progress).toBeDefined();
    expect(Timeline.Background).toBeDefined();
    expect(Timeline.Control).toBeDefined();
    expect(Timeline.Thumb).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Timeline.Progress with expected styles", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control>track</Timeline.Control>
          <Timeline.Progress data-testid="progress" />
        </Timeline>,
        { element: { currentTime: 50, duration: 100 } },
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
        transform: "scaleX(0.5)",
        transformOrigin: "left",
        transition: "transform 250ms linear",
      });
    });

    /**
     * The fill is driven by `currentTime`, which arrives in `timeupdate` steps
     * (~4 Hz), so it would visibly tick without the transition. 250 ms linear
     * matches that cadence: any easing would make the fill advance at a rate the
     * audio does not.
     */
    describe("the progress transition", () => {
      const renderTimeline = () =>
        renderInPlayer(
          <Timeline>
            <Timeline.Control>track</Timeline.Control>
            <Timeline.Thumb data-testid="thumb" />
            <Timeline.Progress data-testid="progress" />
          </Timeline>,
          { element: { currentTime: 50, duration: 100 } },
        );

      it("smooths the timeupdate steps while idle", () => {
        renderTimeline();

        expect(screen.getByTestId("progress").style.transition).toBe(
          "transform 250ms linear",
        );
      });

      /**
       * Off during a drag: there the value updates at pointer rate, and easing
       * reads as the fill lagging the finger.
       */
      it("drops out for the duration of a drag", () => {
        renderTimeline();
        const progress = screen.getByTestId("progress");

        fireEvent(
          screen.getByTestId("thumb"),
          pointerEventAt("pointerdown", alongTrack(0.5)),
        );
        expect(progress.style.transition).toBe("");

        fireEvent(window, pointerEventAt("pointerup", alongTrack(0.75)));
        expect(progress.style.transition).toBe("transform 250ms linear");
      });

      it("lets a consumer's own style win, so it can be dropped", () => {
        renderInPlayer(
          <Timeline>
            <Timeline.Control>track</Timeline.Control>
            <Timeline.Progress
              data-testid="progress"
              style={{ transition: "none" }}
            />
          </Timeline>,
        );

        expect(screen.getByTestId("progress").style.transition).toBe("none");
      });
    });

    it("should render Timeline.Background with expected styles", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Background data-testid="background" />
        </Timeline>,
      );

      expect(screen.getByTestId("background")).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
      });
    });

    it("should render Timeline.Control with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control data-testid="seek">Seek</Timeline.Control>
        </Timeline>,
      );

      const seek = screen.getByTestId("seek");
      expect(seek).toHaveAttribute("role", "slider");
      expect(seek).toHaveAttribute("aria-label", "Timeline slider");
    });

    it("should render Timeline.Thumb with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Thumb data-testid="drag" />
        </Timeline>,
      );

      const drag = screen.getByTestId("drag");
      expect(drag).toHaveAttribute("aria-hidden", "true");
      expect(drag).toHaveAttribute("tabindex", "-1");
    });
  });

  it("should render a container with proper styles", () => {
    renderInPlayer(
      <Timeline>
        <Timeline.Control>track</Timeline.Control>
      </Timeline>,
    );

    const root = screen.getByRole("group");
    expect(root).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      height: "100%",
      position: "relative",
    });
    // S8: `width` moved to `styles.css`, where a class can beat it.
    expect(root.style.width).toBe("");
    expect(root).toHaveAttribute("data-part", "root");
  });

  it("should support composition of components", () => {
    renderInPlayer(
      <Timeline>
        <Timeline.Control data-testid="seek">
          <Timeline.Progress data-testid="progress" />
          <Timeline.Background data-testid="background" />
        </Timeline.Control>
        <Timeline.Thumb data-testid="drag" />
      </Timeline>,
    );

    expect(screen.getByTestId("seek")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });

  // The timeline's max is the duration, so it takes no `maxValue` prop.
  it("takes its range from the duration atom", () => {
    const { emit, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control data-testid="seek">track</Timeline.Control>
      </Timeline>,
      { element: { duration: 100 } },
    );
    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "100");

    element.duration = 250;
    emit("durationchange");

    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "250");
  });
});
