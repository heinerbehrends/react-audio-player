import { describe, it, expect, vi } from "vitest";
import { render, getByRole, fireEvent } from "@testing-library/react";
import { SetSliderValue } from "../../src/Slider/SetSliderValue";
import { createSliderContext } from "../testUtils";
import { TestProviders } from "../testComponents";
import { renderWithStore } from "../store/renderWithStore";

/**
 * The store and the static config, which any component reaching
 * `useHandleMediaKeys` needs: `customKeyboardShortcuts` comes from
 * `PlayerConfigContext` now, and a missing provider throws by design.
 */
const renderInPlayer = (
  ui: React.ReactElement,
  options?: Parameters<typeof render>[1],
) => render(<TestProviders>{ui}</TestProviders>, options);

describe("SetSliderValue", () => {
  it("renders with correct ARIA attributes", () => {
    const context = createSliderContext({
      component: "timeline",
      value: 0.5,
      minValue: 0,
      maxValue: 1,
    });

    const { container } = renderInPlayer(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("aria-valuemin", "0");
    expect(button).toHaveAttribute("aria-valuemax", "1");
    expect(button).toHaveAttribute("aria-valuenow", "0.5");
    expect(button).toHaveAttribute("aria-orientation", "horizontal");
    expect(button).toHaveAttribute("role", "slider");
  });

  it("merges custom styles with calculated styles", () => {
    const context = createSliderContext();
    const customStyle = { backgroundColor: "red" };
    const { container } = renderInPlayer(
      <SetSliderValue sliderContext={context} style={customStyle}>
        Test
      </SetSliderValue>,
    );
    const button = getByRole(container, "slider");

    expect(button.style.backgroundColor).toBe("red");
    expect(button.style.position).toBe("relative");
  });

  it("passes through additional props", () => {
    const context = createSliderContext();
    const { container } = renderInPlayer(
      <SetSliderValue
        sliderContext={context}
        data-testid="slider"
        className="custom-class"
      >
        Test
      </SetSliderValue>,
    );
    const button = getByRole(container, "slider");

    expect(button.getAttribute("data-testid")).toBe("slider");
    expect(button.className).toBe("custom-class");
  });

  it("is in the tab order and attaches event handlers", () => {
    const handleSliderAction = vi.fn();
    const context = createSliderContext({ handleSliderAction });

    const { container } = renderInPlayer(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("tabindex", "0");

    fireEvent.pointerDown(button, { clientX: 50, clientY: 0 });

    expect(handleSliderAction).toHaveBeenCalled();
  });

  it("responds to arrow keys, so the semantic slider is operable by keyboard", () => {
    const context = createSliderContext({ component: "timeline" });

    // The keys reach the element through `store.send` now, so the element comes
    // from the harness rather than from a hand-built `AudioContext`.
    const { container, element } = renderWithStore(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>,
      { element: { currentTime: 20, duration: 100 } },
    );
    const button = getByRole(container, "slider");

    fireEvent.keyDown(button, { key: "ArrowRight" });
    expect(element.currentTime).toBe(25);

    fireEvent.keyDown(button, { key: "ArrowLeft" });
    expect(element.currentTime).toBe(20);
  });
});
