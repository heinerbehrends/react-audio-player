import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Volume } from "../../src/Volume/Volume";
import { VolumeContext } from "../../src/Volume/VolumeContext";

const mockVolumeContext = {
  value: 0.5,
  minValue: 0,
  maxValue: 1,
  step: 0.1,
  orientation: "horizontal" as const,
  sliderLength: 100,
  sliderStart: 0,
  clientXY: 50,
  dragState: "idle" as const,
  component: "volume" as const,
  handleSliderAction: vi.fn(),
};

describe("Volume", () => {
  it("should export all subcomponents", () => {
    expect(Volume.Progress).toBeDefined();
    expect(Volume.Background).toBeDefined();
    expect(Volume.Set).toBeDefined();
    expect(Volume.Drag).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Volume.Progress with expected styles", () => {
      render(
        <VolumeContext.Provider value={mockVolumeContext}>
          <Volume.Progress data-testid="progress" />
        </VolumeContext.Provider>,
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

    it("should render Volume.Background with expected styles", () => {
      render(
        <VolumeContext.Provider value={mockVolumeContext}>
          <Volume.Background data-testid="background" />
        </VolumeContext.Provider>,
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

    it("should render Volume.Set with expected attributes", () => {
      render(
        <VolumeContext.Provider value={mockVolumeContext}>
          <Volume.Set data-testid="set">Set</Volume.Set>
        </VolumeContext.Provider>,
      );

      const set = screen.getByTestId("set");
      expect(set).toBeInTheDocument();
      expect(set).toHaveAttribute("role", "slider");
    });

    it("should render Volume.Drag with expected attributes", () => {
      render(
        <VolumeContext.Provider value={mockVolumeContext}>
          <Volume.Drag data-testid="drag" />
        </VolumeContext.Provider>,
      );

      const drag = screen.getByTestId("drag");
      expect(drag).toBeInTheDocument();
      expect(drag).toHaveAttribute("aria-label", "Drag to adjust volume");
    });
  });

  it("should support composition of components", () => {
    render(
      <VolumeContext.Provider value={mockVolumeContext}>
        <Volume>
          <Volume.Background data-testid="background" />
          <Volume.Progress data-testid="progress" />
          <Volume.Set data-testid="set">Set</Volume.Set>
          <Volume.Drag data-testid="drag" />
        </Volume>
      </VolumeContext.Provider>,
    );

    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("set")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });

  it("should render a container with proper styles and accessibility attributes", () => {
    render(
      <VolumeContext.Provider value={mockVolumeContext}>
        <Volume>
          <div data-testid="volume-child">Content</div>
        </Volume>
      </VolumeContext.Provider>,
    );

    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "Volume controls");
    expect(container).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      width: "100%",
    });
  });
});
