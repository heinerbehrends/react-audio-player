import { describe, it, expect } from "vitest";
import { render, getByRole } from "@testing-library/react";
import { SetSliderValue } from "../../src/Slider/SetSliderValue";
import userEvent from "@testing-library/user-event";
import { createSliderContext } from "../testUtils";

describe("SetSliderValue", () => {
  it("handles pointer down event", async () => {
    const context = createSliderContext();
    const { container } = render(
      <SetSliderValue sliderContext={context}>Test</SetSliderValue>,
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
});
