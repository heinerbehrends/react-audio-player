import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { renderInPlayer } from "../testComponents";
import { stubElementRects, stubResizeObserver } from "../testUtils";

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
    expect(Timeline.Seek).toBeDefined();
    expect(Timeline.Drag).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Timeline.Progress with expected styles", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Seek>track</Timeline.Seek>
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

    it("should render Timeline.Seek with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Seek data-testid="seek">Seek</Timeline.Seek>
        </Timeline>,
      );

      const seek = screen.getByTestId("seek");
      expect(seek).toHaveAttribute("role", "slider");
      expect(seek).toHaveAttribute("aria-label", "Timeline slider");
    });

    it("should render Timeline.Drag with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Drag data-testid="drag" />
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
        <Timeline.Seek>track</Timeline.Seek>
      </Timeline>,
    );

    expect(screen.getByRole("group")).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      width: "100%",
      height: "100%",
      position: "relative",
    });
  });

  it("should support composition of components", () => {
    renderInPlayer(
      <Timeline>
        <Timeline.Seek data-testid="seek">
          <Timeline.Progress data-testid="progress" />
          <Timeline.Background data-testid="background" />
        </Timeline.Seek>
        <Timeline.Drag data-testid="drag" />
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
        <Timeline.Seek data-testid="seek">track</Timeline.Seek>
      </Timeline>,
      { element: { duration: 100 } },
    );
    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "100");

    element.duration = 250;
    emit("durationchange");

    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "250");
  });
});
