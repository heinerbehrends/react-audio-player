import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TimelineProvider } from "../../src/Timeline/TimelineProvider";
import { TimelineContext } from "../../src/Timeline/TimelineContext";
import React from "react";

describe("TimelineProvider", () => {
  const TestComponent = () => {
    const context = React.useContext(TimelineContext);
    return (
      <div data-testid="test-component">
        <div data-testid="component">{context.component}</div>
        <div data-testid="value">{context.value}</div>
        <button
          data-testid="action-button"
          onClick={() =>
            context.handleSliderAction({
              type: "UPDATE_UI_VALUE",
              component: "timeline",
              value: 0.75,
            })
          }
        >
          Test Action
        </button>
      </div>
    );
  };

  it("should provide initial state", () => {
    render(
      <TimelineProvider>
        <TestComponent />
      </TimelineProvider>,
    );

    expect(screen.getByTestId("component")).toHaveTextContent("timeline");
    expect(screen.getByTestId("value")).toHaveTextContent("0");
  });

  it("should handle slider actions", async () => {
    render(
      <TimelineProvider>
        <TestComponent />
      </TimelineProvider>,
    );

    const button = screen.getByTestId("action-button");
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId("value")).toHaveTextContent("0.75");
  });

  it("should memoize context value", () => {
    const { rerender } = render(
      <TimelineProvider>
        <TestComponent />
      </TimelineProvider>,
    );

    const firstValue = screen.getByTestId("value").textContent;
    rerender(
      <TimelineProvider>
        <TestComponent />
      </TimelineProvider>,
    );

    const secondValue = screen.getByTestId("value").textContent;
    expect(firstValue).toBe(secondValue);
  });
});
