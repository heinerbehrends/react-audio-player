import { describe, it, expect, vi } from "vitest";
import { render, getByRole, fireEvent } from "@testing-library/react";
import { SetSliderValue } from "../../src/Slider/SetSliderValue";
import { createSliderContext } from "../testUtils";

describe("SetSliderValue", () => {
  it("renders with correct ARIA attributes", () => {
    const context = createSliderContext({
      component: "timeline",
      value: 0.5,
      minValue: 0,
      maxValue: 1,
    });

    const { container } = render(
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
    const { container } = render(
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
    const { container } = render(
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

  it("attaches event handlers", () => {
    const handleSliderAction = vi.fn();
    const context = createSliderContext({ handleSliderAction });

    const { container } = render(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("tabindex", "-1");

    // Test that the event handler is properly attached by firing the event
    fireEvent.pointerDown(button, { clientX: 50, clientY: 0 });

    // Verify that the slider action was called
    expect(handleSliderAction).toHaveBeenCalled();
  });
});
