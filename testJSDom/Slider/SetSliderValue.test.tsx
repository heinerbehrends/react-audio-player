import { describe, it, expect, vi } from "vitest";
import { render, getByRole } from "@testing-library/react";
import { SetSliderValue } from "../../src/Slider/SetSliderValue";
import React from "react";
import userEvent from "@testing-library/user-event";

describe("SetSliderValue", () => {
  const createSliderContext = (overrides = {}) => ({
    value: 0.5,
    minValue: 0,
    maxValue: 1,
    step: 0.1,
    orientation: "horizontal" as const,
    sliderLength: 100,
    sliderStart: 0,
    clientXY: 50,
    dragState: "idle" as const,
    component: "timeline" as const,
    handleSliderAction: vi.fn(),
    ...overrides,
  });

  it("renders with correct role and attributes", () => {
    const context = createSliderContext();
    const { container } = render(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>
    );
    const button = container.firstChild as HTMLElement;

    expect(button.getAttribute("role")).toBe("slider");
    expect(button.getAttribute("aria-valuemin")).toBe("0");
    expect(button.getAttribute("aria-valuemax")).toBe("1");
    expect(button.getAttribute("aria-valuenow")).toBe("0.5");
  });

  it("handles pointer down event", async () => {
    const context = createSliderContext();
    const { container } = render(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>
    );
    const button = getByRole(container, "slider");

    await userEvent.pointer({
      keys: "[MouseLeft>]",
      target: button,
      coords: { clientX: 60, clientY: 0 },
    });

    expect(context.handleSliderAction).toHaveBeenCalledWith({
      type: "SET_SLIDER_VALUE",
      ...context,
      clientXY: 60,
    });
  });

  it("merges custom styles with calculated styles", () => {
    const context = createSliderContext();
    const customStyle = { backgroundColor: "red" };
    const { container } = render(
      <SetSliderValue sliderContext={context} style={customStyle}>
        Test
      </SetSliderValue>
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
      </SetSliderValue>
    );
    const button = getByRole(container, "slider");

    expect(button.getAttribute("data-testid")).toBe("slider");
    expect(button.className).toBe("custom-class");
  });
});
