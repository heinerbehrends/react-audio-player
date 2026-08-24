import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { VolumeProvider } from "../../src/Volume/VolumeProvider";
import { VolumeContext } from "../../src/Volume/VolumeContext";
import React from "react";
import { TestProviders } from "../testComponents";

/**
 * The store, which `useHandleSideEffect` reads now that it is an alias for
 * `store.send`.
 */
const renderInPlayer = (
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1],
) => render(<TestProviders>{ui}</TestProviders>, options);

describe("VolumeProvider", () => {
  const TestComponent = () => {
    const context = React.useContext(VolumeContext);
    return (
      <div data-testid="test-component">
        <div data-testid="component">{context.component}</div>
        <div data-testid="orientation">{context.orientation}</div>
        <div data-testid="value">{context.value}</div>
        <button
          data-testid="action-button"
          onClick={() =>
            context.handleSliderAction({
              type: "UPDATE_UI_VALUE",
              component: "volume",
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
    renderInPlayer(
      <VolumeProvider orientation="horizontal">
        <TestComponent />
      </VolumeProvider>,
    );

    expect(screen.getByTestId("component")).toHaveTextContent("volume");
    expect(screen.getByTestId("orientation")).toHaveTextContent("horizontal");
    expect(screen.getByTestId("value")).toHaveTextContent("1");
  });

  it("should handle slider actions", async () => {
    renderInPlayer(
      <VolumeProvider orientation="horizontal">
        <TestComponent />
      </VolumeProvider>,
    );

    const button = screen.getByTestId("action-button");
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId("value")).toHaveTextContent("0.75");
  });

  it("should memoize context value", () => {
    const { rerender } = renderInPlayer(
      <VolumeProvider orientation="horizontal">
        <TestComponent />
      </VolumeProvider>,
    );

    const firstValue = screen.getByTestId("value").textContent;
    rerender(
      <TestProviders>
        <VolumeProvider orientation="horizontal">
          <TestComponent />
        </VolumeProvider>
      </TestProviders>,
    );

    const secondValue = screen.getByTestId("value").textContent;
    expect(firstValue).toBe(secondValue);
  });

  it("should handle vertical orientation", () => {
    renderInPlayer(
      <VolumeProvider orientation="vertical">
        <TestComponent />
      </VolumeProvider>,
    );

    expect(screen.getByTestId("orientation")).toHaveTextContent("vertical");
  });
});
