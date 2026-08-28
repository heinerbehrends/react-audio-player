import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
 * `SliderControl` is `Timeline.Control`, `Volume.Control` and `PlaybackRateSlider.Control`,
 * so it is tested through a real slider root: it reads the context its root
 * publishes and has no props of its own beyond the DOM's.
 */
describe("SliderControl", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("renders with correct ARIA attributes", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Control>Test</Timeline.Control>
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
        <Volume.Control>Test</Volume.Control>
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
        <Timeline.Control style={{ backgroundColor: "red" }}>
          Test
        </Timeline.Control>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button.style.backgroundColor).toBe("red");
    expect(button.style.position).toBe("relative");
  });

  it("passes through additional props", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Control data-testid="slider" className="custom-class">
          Test
        </Timeline.Control>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("data-testid", "slider");
    expect(button).toHaveClass("custom-class");
  });

  it("is in the tab order, unlike the thumb", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Control>Test</Timeline.Control>
      </Timeline>,
    );
    const button = getByRole(container, "slider");

    expect(button).toHaveAttribute("tabindex", "0");
    expect(button).not.toHaveAttribute("aria-hidden");
  });

  /**
   * Spreading `{...props}` used to replace these rather than add to them, so a
   * consumer adding an analytics handler silently removed arrow-key adjustment
   * and every media shortcut — no error, and the types allowed it.
   */
  it("runs a consumer's onKeyDown as well as its own", () => {
    const seen: string[] = [];
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control onKeyDown={() => seen.push("consumer")}>
          Test
        </Timeline.Control>
      </Timeline>,
      { element: { currentTime: 30, duration: 120 } },
    );

    fireEvent.keyDown(getByRole(container, "slider"), { key: "ArrowRight" });

    expect(seen).toEqual(["consumer"]);
    expect(element.currentTime).toBe(35);
  });

  it("runs a consumer's onPointerDown as well as its own", () => {
    const onPointerDown = vi.fn();
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control onPointerDown={onPointerDown}>Test</Timeline.Control>
      </Timeline>,
      { element: { currentTime: 0, duration: 100 } },
    );
    const slider = getByRole(container, "slider");

    fireEvent(slider, pointerEventAt("pointerdown", alongTrack(0.5)));

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(element.currentTime).toBe(50);
  });

  /** The documented opt-out: preventDefault suppresses the library behaviour. */
  it("lets a consumer cancel the library handler with preventDefault", () => {
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control onKeyDown={(event) => event.preventDefault()}>
          Test
        </Timeline.Control>
      </Timeline>,
      { element: { currentTime: 30, duration: 120 } },
    );

    fireEvent.keyDown(getByRole(container, "slider"), { key: "ArrowRight" });

    expect(element.currentTime).toBe(30);
  });

  it("keeps its tab stop and role even when a consumer overrides them", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Control tabIndex={-1} role="button">
          Test
        </Timeline.Control>
      </Timeline>,
    );
    const slider = getByRole(container, "slider");

    expect(slider).toHaveAttribute("tabindex", "0");
  });

  it("seeks to the pressed fraction of the track", () => {
    const { container, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control>Test</Timeline.Control>
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
        <Timeline.Control>Test</Timeline.Control>
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
