import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { SliderContext } from "../../src/Slider/SliderContext";

const mockContextValue: SliderContext = {
  sliderStart: 10,
  sliderLength: 100,
  value: 1.5,
  minValue: 0.5,
  maxValue: 4,
  clientXY: 0,
  orientation: "horizontal" as const,
  step: 0.1,
  component: "playbackRate" as const,
  handleSliderAction: vi.fn(),
  dragState: "idle" as const,
};
// Mock the provider to capture prop values
vi.mock("../../src/PlaybackRate/PlaybackRateProvider", () => ({
  PlaybackRateProvider: vi.fn(({ children, ...props }) => (
    <div data-testid="mock-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  )),
}));

describe("PlaybackRateSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(
      <PlaybackRateSlider>
        <div data-testid="child">Test</div>
      </PlaybackRateSlider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("mock-provider")).toBeInTheDocument();

    const providerProps = JSON.parse(
      screen.getByTestId("mock-provider").getAttribute("data-props") || "{}",
    );
    expect(providerProps.maxValue).toBe(4);
    expect(providerProps.minValue).toBe(0.5);
    expect(providerProps.step).toBe(0.1);
  });

  it("should pass custom props to provider", () => {
    render(
      <PlaybackRateSlider maxValue={8} minValue={1} step={0.5}>
        <div>Test</div>
      </PlaybackRateSlider>,
    );

    const providerProps = JSON.parse(
      screen.getByTestId("mock-provider").getAttribute("data-props") || "{}",
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
      const testContextValue: SliderContext = {
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
        "Drag to seek",
      );
    });
  });

  it("should integrate all components together", () => {
    // For this test, we'll unmock the provider
    vi.restoreAllMocks();

    // Provide the initial value through props
    render(
      <PlaybackRateSlider data-testid="slider">
        <PlaybackRateSlider.Background data-testid="background" />
        <PlaybackRateSlider.Set data-testid="set">1.0x</PlaybackRateSlider.Set>
        <PlaybackRateSlider.Drag data-testid="drag" />
      </PlaybackRateSlider>,
    );

    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-label",
      "Playback rate slider",
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemin", "0.5");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "4");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "0x");
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("set")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
    expect(screen.getByText("1.0x")).toBeInTheDocument();
  });
});
