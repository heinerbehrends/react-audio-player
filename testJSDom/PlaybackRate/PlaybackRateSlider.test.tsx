vi.mock("../../src/PlaybackRate/PlaybackRateProvider", () => ({
  PlaybackRateProvider: ({
    children,
    ...props
  }: { children: React.ReactNode } & {
    maxValue?: number;
    minValue?: number;
    step?: number;
  }) => (
    <div
      data-testid="mock-PlaybackRateProvider"
      data-props={JSON.stringify(props)}
    >
      {children}
    </div>
  ),
}));

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { SliderContextType } from "../../src/Slider/SliderContext";
import { createSliderContext } from "../testUtils";

const mockContextValue: SliderContextType = createSliderContext({
  sliderStart: 10,
  sliderLength: 100,
  value: 1.5,
  clientXY: 0,
  step: 0.1,
  component: "playbackRate" as const,
  handleSliderAction: vi.fn(),
});

describe("PlaybackRateSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass custom props to provider", () => {
    render(
      <PlaybackRateSlider maxValue={8} minValue={1} step={0.5}>
        <div>Test</div>
      </PlaybackRateSlider>,
    );

    const providerProps = JSON.parse(
      screen
        .getByTestId("mock-PlaybackRateProvider")
        .getAttribute("data-props") || "{}",
    );
    expect(providerProps.maxValue).toBe(8);
    expect(providerProps.minValue).toBe(1);
    expect(providerProps.step).toBe(0.5);
  });

  it("should apply custom styles", () => {
    // Since we can't check actual styling with mocks, test the props are passed correctly
    render(
      <PlaybackRateSlider
        data-testid="slider"
        style={{ backgroundColor: "red", margin: "10px" }}
      >
        Test
      </PlaybackRateSlider>,
    );

    // Check that the parent div was rendered
    const div = screen.getByTestId("slider");
    expect(div).toHaveStyle("background-color: rgb(255, 0, 0)");
    expect(div).toHaveStyle("margin: 10px");
    expect(div).toHaveStyle("display: grid");
    expect(div).toHaveStyle("width: 100%");
    expect(div).toHaveStyle("grid-template-columns: 1fr");
    expect(div).toHaveStyle("grid-template-rows: 1fr");
  });

  describe("PlaybackRateSlider.Background", () => {
    it("should render with progress styles", () => {
      render(<PlaybackRateSlider.Background data-testid="background" />);
      const background = screen.getByTestId("background");
      expect(background).toBeInTheDocument();
      expect(background).toHaveStyle("grid-column: 1 / 1");
      expect(background).toHaveStyle("grid-row: 1 / 1");
      expect(background).toHaveStyle("width: 100%");
      expect(background).toHaveStyle("height: 100%");
    });

    it("should merge custom styles with default styles", () => {
      render(
        <PlaybackRateSlider.Background
          data-testid="background"
          style={{ backgroundColor: "blue" }}
        />,
      );

      const background = screen.getByTestId("background");
      expect(background).toBeInTheDocument();
      const styleAttr = background.getAttribute("style") || "";
      expect(styleAttr).toContain("blue");
      expect(styleAttr).toContain("grid-column: 1 / 1");
      expect(styleAttr).toContain("grid-row: 1 / 1");
      expect(styleAttr).toContain("width: 100%");
      expect(styleAttr).toContain("height: 100%");
    });
  });

  describe("PlaybackRateSlider.Set", () => {
    it("should render and pass props to SetSliderValue", () => {
      // Mock context value
      const testContextValue: SliderContextType = {
        ...mockContextValue,
        component: "playbackRate" as const,
        handleSliderAction: vi.fn(),
      };

      vi.spyOn(React, "useContext").mockReturnValue(testContextValue);

      render(
        <PlaybackRateSlider.Set data-testid="set-button">
          1.5x
        </PlaybackRateSlider.Set>,
      );

      expect(screen.getByTestId("set-button")).toBeInTheDocument();
      expect(screen.getByText("1.5x")).toBeInTheDocument();
    });
  });

  describe("PlaybackRateSlider.Drag", () => {
    it("should render and pass context to DragButton", () => {
      vi.spyOn(React, "useContext").mockReturnValue(mockContextValue);

      render(<PlaybackRateSlider.Drag data-testid="drag-button" />);

      expect(screen.getByTestId("drag-button")).toBeInTheDocument();
      expect(screen.getByTestId("drag-button")).toHaveAttribute(
        "aria-label",
        "Drag or use > and < and ] and [ keys to adjust playback rate",
      );
    });
  });

  it("should integrate all components together", () => {
    const initialValue = 1;
    const mockContext = createSliderContext({
      value: initialValue,
      minValue: 0.5,
      maxValue: 4,
      step: 0.1,
      component: "playbackRate" as const,
    });

    vi.spyOn(React, "useContext").mockReturnValue(mockContext);

    render(
      <PlaybackRateSlider data-testid="slider">
        <PlaybackRateSlider.Background data-testid="background" />
        <PlaybackRateSlider.Set data-testid="set">1.0x</PlaybackRateSlider.Set>
        <PlaybackRateSlider.Drag data-testid="drag" />
      </PlaybackRateSlider>,
    );

    // Test component structure
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-label", "Playback rate slider");
    expect(slider).toHaveAttribute("aria-orientation", "horizontal");

    // Test that all subcomponents are rendered
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("set")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
    expect(screen.getByText("1.0x")).toBeInTheDocument();

    // Test that aria attributes are present and valid
    expect(slider).toHaveAttribute("aria-valuemin");
    expect(slider).toHaveAttribute("aria-valuemax");
    expect(slider).toHaveAttribute("aria-valuenow");
    expect(slider).toHaveAttribute("aria-valuetext");
  });
});
