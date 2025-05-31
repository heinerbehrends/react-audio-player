import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { TimelineContext } from "../../src/Timeline/TimelineContext";

const mockTimelineContext = {
  value: 0.5,
  minValue: 0,
  maxValue: 1,
  step: 0.1,
  orientation: "horizontal" as const,
  sliderLength: 100,
  sliderStart: 0,
  clientXY: 50,
  dragState: "idle" as const,
  component: "timeline" as const,
  handleSliderAction: vi.fn(),
};

describe("Timeline", () => {
  it("should export all subcomponents", () => {
    expect(Timeline.Progress).toBeDefined();
    expect(Timeline.Background).toBeDefined();
    expect(Timeline.Seek).toBeDefined();
    expect(Timeline.Drag).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Timeline.Progress with expected styles", () => {
      render(
        <TimelineContext.Provider value={mockTimelineContext}>
          <Timeline.Progress data-testid="progress" />
        </TimelineContext.Provider>,
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
      render(
        <TimelineContext.Provider value={mockTimelineContext}>
          <Timeline.Background data-testid="background" />
        </TimelineContext.Provider>,
      );

      const background = screen.getByTestId("background");
      expect(background).toBeInTheDocument();
      expect(background).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
      });
    });

    it("should render Timeline.Seek with expected attributes", () => {
      render(
        <TimelineContext.Provider value={mockTimelineContext}>
          <Timeline.Seek data-testid="seek">Seek</Timeline.Seek>
        </TimelineContext.Provider>,
      );

      const seek = screen.getByTestId("seek");
      expect(seek).toBeInTheDocument();
      expect(seek).toHaveAttribute("role", "slider");
    });

    it("should render Timeline.Drag with expected attributes", () => {
      render(
        <TimelineContext.Provider value={mockTimelineContext}>
          <Timeline.Drag data-testid="drag" />
        </TimelineContext.Provider>,
      );

      const drag = screen.getByTestId("drag");
      expect(drag).toBeInTheDocument();
      expect(drag).toHaveAttribute("aria-label", "Drag to seek");
    });
  });

  it("should support composition of components", () => {
    render(
      <TimelineContext.Provider value={mockTimelineContext}>
        <Timeline>
          <Timeline.Background data-testid="background" />
          <Timeline.Progress data-testid="progress" />
          <Timeline.Seek data-testid="seek">Seek</Timeline.Seek>
          <Timeline.Drag data-testid="drag" />
        </Timeline>
      </TimelineContext.Provider>,
    );

    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("seek")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });

  it("should render a container with proper styles", () => {
    render(
      <TimelineContext.Provider value={mockTimelineContext}>
        <Timeline>
          <div data-testid="timeline-child">Content</div>
        </Timeline>
      </TimelineContext.Provider>,
    );

    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      width: "100%",
      height: "100%",
      position: "relative",
    });
  });
});
