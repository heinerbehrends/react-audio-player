import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Volume } from "../../src/Volume/Volume";
import { VolumeContext } from "../../src/Volume/VolumeContext";
import { createPlayerContext, createSliderContext } from "../testUtils";
import { renderWithPlayerContext } from "../testComponents";

const defaultSliderContext = createSliderContext({
  component: "volume" as const,
  value: 0.5,
  minValue: 0,
  maxValue: 1,
});

const playerContext = createPlayerContext();

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
        <VolumeContext.Provider value={defaultSliderContext}>
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
      renderWithPlayerContext({
        component: <Volume.Background data-testid="background" />,
        playerContext,
      });

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
      renderWithPlayerContext({
        playerContext,
        component: <Volume.Set data-testid="set">Set</Volume.Set>,
      });

      const set = screen.getByTestId("set");
      expect(set).toBeInTheDocument();
      expect(set).toHaveAttribute("role", "slider");
    });

    it("should render Volume.Drag with expected attributes", () => {
      renderWithPlayerContext({
        playerContext,
        component: <Volume.Drag data-testid="drag" />,
      });

      const drag = screen.getByTestId("drag");
      expect(drag).toBeInTheDocument();
      expect(drag).toHaveAttribute("aria-hidden", "true");
      expect(drag).toHaveAttribute("tabindex", "-1");
    });
  });

  it("should support composition of components", () => {
    render(
      <VolumeContext.Provider value={defaultSliderContext}>
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
      <VolumeContext.Provider value={defaultSliderContext}>
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
