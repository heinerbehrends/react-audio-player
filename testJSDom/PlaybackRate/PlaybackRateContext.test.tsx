import { useContext } from "react";
import { describe, it, expect, vi } from "vitest";
import { PlaybackRateContext } from "../../src/PlaybackRate/PlaybackRateContext";
import { render, screen } from "@testing-library/react";
import { createSliderContext } from "../testUtils";

describe("PlaybackRateContext", () => {
  it("should be created with the expected default values", () => {
    expect(PlaybackRateContext).toBeDefined();
  });

  it("should be consumable by React components", () => {
    // Create a test component that consumes the context
    const TestComponent = () => {
      const context = useContext(PlaybackRateContext);
      return (
        <div data-testid="context-consumer">
          <span data-testid="min-value">{context.minValue}</span>
          <span data-testid="max-value">{context.maxValue}</span>
          <span data-testid="step">{context.step}</span>
          <span data-testid="component">{context.component}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId("min-value").textContent).toBe("0.5");
    expect(screen.getByTestId("max-value").textContent).toBe("4");
    expect(screen.getByTestId("step").textContent).toBe("0.25");
    expect(screen.getByTestId("component").textContent).toBe("playbackRate");
  });

  it("should allow context values to be overridden with Provider", () => {
    // Create a test component with a provider
    const TestComponent = () => {
      const testValue = createSliderContext({
        sliderStart: 10,
        sliderLength: 100,
        value: 2,
        minValue: 1,
        maxValue: 5,
        step: 0.5,
        clientXY: 0,
        component: "playbackRate" as const,
        handleSliderAction: vi.fn(),
      });

      return (
        <PlaybackRateContext.Provider value={testValue}>
          <ContextConsumer />
        </PlaybackRateContext.Provider>
      );
    };

    const ContextConsumer = () => {
      const context = useContext(PlaybackRateContext);
      return (
        <div>
          <span data-testid="min-value">{context.minValue}</span>
          <span data-testid="max-value">{context.maxValue}</span>
          <span data-testid="step">{context.step}</span>
          <span data-testid="value">{context.value}</span>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId("min-value").textContent).toBe("1");
    expect(screen.getByTestId("max-value").textContent).toBe("5");
    expect(screen.getByTestId("step").textContent).toBe("0.5");
    expect(screen.getByTestId("value").textContent).toBe("2");
  });
});
