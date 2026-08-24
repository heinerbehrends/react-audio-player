import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { renderInPlayer } from "../testComponents";
import {
  alongTrack,
  pointerEventAt,
  stubElementRects,
  stubResizeObserver,
} from "../testUtils";

describe("DragButton", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  const renderThumb = (props: React.HTMLAttributes<HTMLButtonElement> = {}) =>
    renderInPlayer(
      <Timeline>
        <Timeline.Seek>track</Timeline.Seek>
        <Timeline.Drag data-testid="thumb" {...props} />
      </Timeline>,
      { element: { currentTime: 50, duration: 100 } },
    );

  it("is hidden from assistive technology and out of the tab order", () => {
    renderThumb();
    const thumb = screen.getByTestId("thumb");

    expect(thumb).toHaveAttribute("aria-hidden", "true");
    expect(thumb).toHaveAttribute("tabindex", "-1");
    expect(thumb).not.toHaveAttribute("role");
  });

  it("applies the calculated position", () => {
    renderThumb();
    const thumb = screen.getByTestId("thumb");

    // Halfway along a 200px track.
    expect(thumb.style.transform).toBe("translate(calc(100px - 20px), 0)");
    expect(thumb.style.cursor).toBe("grab");
    expect(thumb.style.touchAction).toBe("none");
  });

  it("merges custom styles with calculated styles", () => {
    renderThumb({ style: { backgroundColor: "red" } });
    const thumb = screen.getByTestId("thumb");

    expect(thumb.style.backgroundColor).toBe("red");
    expect(thumb.style.position).toBe("absolute");
  });

  it("passes through additional props", () => {
    renderThumb({ className: "custom-class" });

    expect(screen.getByTestId("thumb")).toHaveClass("custom-class");
  });

  it("starts a drag on pointer down, without writing the element", () => {
    const { element } = renderThumb();
    const thumb = screen.getByTestId("thumb");

    fireEvent(thumb, pointerEventAt("pointerdown", alongTrack(0.5)));
    fireEvent(window, pointerEventAt("pointermove", alongTrack(0.75)));

    // Seek mode commits on release only.
    expect(element.currentTime).toBe(50);

    fireEvent(window, pointerEventAt("pointerup", alongTrack(0.75)));

    expect(element.currentTime).toBe(75);
  });
});
