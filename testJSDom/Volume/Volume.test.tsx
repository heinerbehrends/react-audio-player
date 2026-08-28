import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Volume } from "../../src/Volume/Volume";
import { renderInPlayer } from "../testComponents";
import {
  alongTrack,
  pointerEventAt,
  stubElementRects,
  stubResizeObserver,
} from "../testUtils";

describe("Volume", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("should export all subcomponents", () => {
    expect(Volume.Progress).toBeDefined();
    expect(Volume.Background).toBeDefined();
    expect(Volume.Control).toBeDefined();
    expect(Volume.Thumb).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Volume.Progress with expected styles", () => {
      renderInPlayer(
        <Volume>
          <Volume.Control>track</Volume.Control>
          <Volume.Progress data-testid="progress" />
        </Volume>,
        { element: { volume: 0.5 } },
      );

      expect(screen.getByTestId("progress")).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
        transform: "scaleX(0.5)",
        transformOrigin: "left",
      });
    });

    it("should render Volume.Background with expected styles", () => {
      renderInPlayer(
        <Volume>
          <Volume.Background data-testid="background" />
        </Volume>,
      );

      expect(screen.getByTestId("background")).toHaveStyle({
        width: "100%",
        height: "100%",
      });
    });

    it("should render Volume.Control with expected attributes", () => {
      renderInPlayer(
        <Volume>
          <Volume.Control data-testid="set">Set</Volume.Control>
        </Volume>,
      );

      const set = screen.getByTestId("set");
      expect(set).toHaveAttribute("role", "slider");
      expect(set).toHaveAttribute("aria-label", "Volume slider");
    });

    it("should render Volume.Thumb with expected attributes", () => {
      renderInPlayer(
        <Volume>
          <Volume.Thumb data-testid="drag" />
        </Volume>,
      );

      const drag = screen.getByTestId("drag");
      expect(drag).toHaveAttribute("aria-hidden", "true");
      expect(drag).toHaveAttribute("tabindex", "-1");
    });
  });

  /**
   * A11: the root carries no role and no name. "Volume controls" wrapped a
   * single control already named "Volume slider" — a group of one, announced
   * twice.
   */
  it("should render a container with proper styles and no role of its own", () => {
    const view = renderInPlayer(
      <Volume>
        <Volume.Control>track</Volume.Control>
      </Volume>,
    );

    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByLabelText("Volume controls")).toBeNull();

    const container = view.container.querySelector(
      '[data-part="root"]',
    ) as HTMLElement;
    expect(container).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      // S12: `Thumb` is `position: absolute`, so without this its containing
      // block is whichever ancestor happens to be positioned.
      position: "relative",
    });
    // S8: `width` moved to `styles.css`, where a class can beat it.
    expect(container.style.width).toBe("");
    expect(container).toHaveAttribute("data-part", "root");
  });

  it("should support composition of components", () => {
    renderInPlayer(
      <Volume>
        <Volume.Control data-testid="set">
          <Volume.Progress data-testid="progress" />
          <Volume.Background data-testid="background" />
        </Volume.Control>
        <Volume.Thumb data-testid="drag" />
      </Volume>,
    );

    expect(screen.getByTestId("set")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });

  it("writes the volume when the track is pressed", () => {
    const { element } = renderInPlayer(
      <Volume>
        <Volume.Control data-testid="set">track</Volume.Control>
      </Volume>,
      { element: { volume: 1 } },
    );

    fireEvent(
      screen.getByTestId("set"),
      pointerEventAt("pointerdown", alongTrack(0.25)),
    );

    expect(element.volume).toBeCloseTo(0.25, 5);
  });

  // Vertical volume runs bottom to top, so a low pointer is a low volume.
  it("inverts the pointer position when vertical", () => {
    const { element } = renderInPlayer(
      <Volume orientation="vertical">
        <Volume.Control data-testid="set">track</Volume.Control>
      </Volume>,
      { element: { volume: 1 } },
    );

    fireEvent(
      screen.getByTestId("set"),
      pointerEventAt("pointerdown", alongTrack(0.75)),
    );

    expect(element.volume).toBeCloseTo(0.25, 5);
  });
});
