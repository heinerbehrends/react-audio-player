import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DragButton } from "../../src/Slider/DragButton";
import { createSliderContext } from "../testUtils";

describe("DragButton", () => {
  it("is hidden from assistive technology and out of the tab order", () => {
    const context = createSliderContext();
    const { container } = render(<DragButton sliderContext={context} />);
    const button = container.firstChild as HTMLElement;

    expect(button).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveAttribute("tabindex", "-1");
    expect(button).not.toHaveAttribute("role");
    expect(button).not.toHaveAttribute("aria-label");
  });

  it("applies correct styles", () => {
    const context = createSliderContext();
    const { container } = render(<DragButton sliderContext={context} />);
    const button = container.firstChild as HTMLElement;

    expect(button.style.position).toBe("absolute");
    expect(button.style.gridColumn).toBe("1 / 1");
    expect(button.style.gridRow).toBe("1 / 1");
    expect(button.style.cursor).toBe("grab");
    expect(button.style.touchAction).toBe("none");
  });

  it("handles pointer down event", async () => {
    const context = createSliderContext();
    const { container } = render(<DragButton sliderContext={context} />);
    const button = container.firstChild as HTMLElement;

    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: button,
      coords: { clientX: 50, clientY: 0 },
    });

    const calls = (
      context.handleSliderAction as unknown as ReturnType<typeof vi.fn>
    ).mock.calls;
    expect(calls[0]?.[0]?.type).toBe("DRAG_START");
    expect(calls[0]?.[0]?.clientXY).toBe(50);
  });

  it("merges custom styles with calculated styles", () => {
    const context = createSliderContext();
    const customStyle = { backgroundColor: "red" };
    const { container } = render(
      <DragButton sliderContext={context} style={customStyle} />,
    );
    const button = container.firstChild as HTMLElement;

    expect(button.style.backgroundColor).toBe("red");
    expect(button.style.position).toBe("absolute");
  });

  it("passes through additional props", () => {
    const context = createSliderContext();
    const { container } = render(
      <DragButton
        sliderContext={context}
        data-testid="drag-button"
        className="custom-class"
      />,
    );
    const button = container.firstChild as HTMLElement;

    expect(button.getAttribute("data-testid")).toBe("drag-button");
    expect(button.className).toBe("custom-class");
  });
});
