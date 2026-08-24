import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getByRole, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { Volume } from "../../src/Volume/Volume";
import { renderInPlayer } from "../testComponents";
import {
  alongTrack,
  pointerEventAt,
  stubElementRects,
  stubResizeObserver,
} from "../testUtils";

/**
 * `SetSliderValue` is `Timeline.Seek`, `Volume.Set` and `PlaybackRateSlider.Set`,
 * so it is tested through a real slider root: it reads the context its root
 * publishes and has no props of its own beyond the DOM's.
 */
describe("SetSliderValue", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("renders with correct ARIA attributes", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Seek>Test</Timeline.Seek>
      </Timeline>,
      { element: { currentTime: 30, duration: 120 } },
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("role", "slider");
    expect(button).toHaveAttribute("aria-label", "Timeline slider");
    expect(button).toHaveAttribute("aria-valuemin", "0");
    expect(button).toHaveAttribute("aria-valuemax", "120");
    expect(button).toHaveAttribute("aria-valuenow", "30");
    expect(button).toHaveAttribute("aria-valuetext", "Position 0:30 of 2:00");
    expect(button).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("takes its label and value text from the mode", () => {
    const { container } = renderInPlayer(
      <Volume>
        <Volume.Set>Test</Volume.Set>
      </Volume>,
      { element: { volume: 0.42 } },
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("aria-label", "Volume slider");
    expect(button).toHaveAttribute("aria-valuetext", "42%");
    expect(button).toHaveAttribute("aria-valuemax", "1");
  });

  it("merges custom styles with calculated styles", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Seek style={{ backgroundColor: "red" }}>Test</Timeline.Seek>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button.style.backgroundColor).toBe("red");
    expect(button.style.position).toBe("relative");
  });

  it("passes through additional props", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Seek data-testid="slider" className="custom-class">
          Test
        </Timeline.Seek>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("data-testid", "slider");
    expect(button).toHaveClass("custom-class");
  });

  it("is in the tab order, unlike the thumb", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Seek>Test</Timeline.Seek>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("tabindex", "0");
    expect(button).not.toHaveAttribute("aria-hidden");
  });

  it("seeks to the pressed fraction of the track", () => {
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Seek>Test</Timeline.Seek>
      </Timeline>,
      { element: { duration: 100 } },
    );
    const button = getByRole(container, "slider");

    fireEvent(button, pointerEventAt("pointerdown", alongTrack(0.25)));

    expect(element.currentTime).toBe(25);
  });

  it("responds to arrow keys, so the semantic slider is operable by keyboard", () => {
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Seek>Test</Timeline.Seek>
      </Timeline>,
      { element: { currentTime: 20, duration: 100 } },
    );
    const button = getByRole(container, "slider");

    fireEvent.keyDown(button, { key: "ArrowRight" });
    expect(element.currentTime).toBe(25);

    fireEvent.keyDown(button, { key: "ArrowLeft" });
    expect(element.currentTime).toBe(20);
  });
});
