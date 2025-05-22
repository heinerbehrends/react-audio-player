import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PlaybackRateProvider } from "../../src/PlaybackRate/PlaybackRateProvider";
import { PlaybackRateContext } from "../../src/PlaybackRate/PlaybackRateContext";
import React, { useContext } from "react";
import * as attachSliderModule from "../../src/Slider/hooks/useAttachSliderCallback";
import { SliderContext } from "../../src/Slider/SliderContext";

// Create a test component to access context values
const TestConsumer = ({
  testId = "test-value",
  onMount,
}: {
  testId?: string;
  onMount?: (context: SliderContext) => void;
}) => {
  const context = useContext(PlaybackRateContext);

  // Call onMount with the context when component mounts
  React.useEffect(() => {
    if (!context) return;
    if (!onMount) return;
    onMount(context);
  }, [context, onMount]);

  return (
    <div>
      <span data-testid={`${testId}-minValue`}>{context.minValue}</span>
      <span data-testid={`${testId}-maxValue`}>{context.maxValue}</span>
      <span data-testid={`${testId}-step`}>{context.step}</span>
      <span data-testid={`${testId}-value`}>{context.value}</span>
      <span data-testid={`${testId}-orientation`}>{context.orientation}</span>
      <span data-testid={`${testId}-component`}>{context.component}</span>
      <button
        data-testid={`${testId}-action-button`}
        onClick={() => context.handleSliderAction({ type: "STOP_AUDIO" })}
      >
        Trigger Action
      </button>
    </div>
  );
};

describe("PlaybackRateProvider", () => {
  const mockHandleAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Only mock the external hook that's used by the component
    vi.spyOn(attachSliderModule, "useAttachSliderCallback").mockReturnValue(
      mockHandleAction
    );
  });

  it("renders children correctly", () => {
    render(
      <PlaybackRateProvider minValue={0.5} maxValue={4} step={0.25}>
        <div data-testid="child">Child content</div>
      </PlaybackRateProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent("Child content");
  });

  it("provides context with default values when not specified", () => {
    render(
      <PlaybackRateProvider>
        <TestConsumer testId="default" />
      </PlaybackRateProvider>
    );

    // Check rendered values
    expect(screen.getByTestId("default-minValue")).toHaveTextContent("0.5");
    expect(screen.getByTestId("default-maxValue")).toHaveTextContent("4");
    expect(screen.getByTestId("default-step")).toHaveTextContent("0.25");
    expect(screen.getByTestId("default-component")).toHaveTextContent(
      "playbackRate"
    );
  });

  it("provides context with custom values when specified", () => {
    render(
      <PlaybackRateProvider minValue={0.2} maxValue={3} step={0.1}>
        <TestConsumer testId="custom" />
      </PlaybackRateProvider>
    );

    // Check rendered values
    expect(screen.getByTestId("custom-minValue")).toHaveTextContent("0.2");
    expect(screen.getByTestId("custom-maxValue")).toHaveTextContent("3");
    expect(screen.getByTestId("custom-step")).toHaveTextContent("0.1");
  });

  it("calls useAttachSliderCallback with playbackRate component", () => {
    render(
      <PlaybackRateProvider>
        <TestConsumer />
      </PlaybackRateProvider>
    );

    expect(attachSliderModule.useAttachSliderCallback).toHaveBeenCalledWith({
      component: "playbackRate",
      dispatch: expect.any(Function),
    });
  });

  it("provides handler from useAttachSliderCallback", () => {
    render(
      <PlaybackRateProvider>
        <TestConsumer />
      </PlaybackRateProvider>
    );

    // Trigger the action
    fireEvent.click(screen.getByTestId("test-value-action-button"));

    // Mock handler should be called with the right action
    expect(mockHandleAction).toHaveBeenCalledWith({
      type: "STOP_AUDIO",
    });
  });

  it("maintains consistent context between renders", () => {
    // Create spies to track renders and context
    const renderSpy = vi.fn();

    // Custom component that logs each render
    function ContextTracker() {
      const context = useContext(PlaybackRateContext);

      // Track each render with the current context
      renderSpy(context);

      return null;
    }

    const { rerender } = render(
      <PlaybackRateProvider>
        <ContextTracker />
      </PlaybackRateProvider>
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);
    const firstContext = renderSpy.mock.calls[0][0];

    // Force re-render
    rerender(
      <PlaybackRateProvider>
        <ContextTracker />
      </PlaybackRateProvider>
    );

    expect(renderSpy).toHaveBeenCalledTimes(2);
    const secondContext = renderSpy.mock.calls[1][0];

    // Value should have the same properties
    expect(Object.keys(secondContext)).toEqual(Object.keys(firstContext));
    expect(secondContext.component).toBe("playbackRate");

    // handleSliderAction should be the same function reference
    // This verifies useMemo is working correctly
    expect(secondContext.handleSliderAction).toBe(
      firstContext.handleSliderAction
    );
  });
});
