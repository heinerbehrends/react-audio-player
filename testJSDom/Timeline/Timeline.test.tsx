import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Timeline } from "../../src/Timeline/Timeline";
import { renderInPlayer } from "../testComponents";
import { stubElementRects, stubResizeObserver } from "../testUtils";

describe("Timeline", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  it("should export all subcomponents", () => {
    expect(Timeline.Progress).toBeDefined();
    expect(Timeline.Background).toBeDefined();
    expect(Timeline.Control).toBeDefined();
    expect(Timeline.Thumb).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render Timeline.Progress with expected styles", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control>track</Timeline.Control>
          <Timeline.Progress data-testid="progress" />
        </Timeline>,
        { element: { currentTime: 50, duration: 100 } },
      );

      const progress = screen.getByTestId("progress");
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
      });
      expect(progress).toHaveAttribute("data-orientation", "horizontal");
    });

    /**
     * S28. Size and transform come from a zero-specificity rule reading
     * `--progress`, so a consumer's stylesheet can replace them. Inline, they
     * outranked every rule, and the README's `width` fill did nothing.
     */
    it("leaves the fill's size and transform to a rule it ships", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control>track</Timeline.Control>
          <Timeline.Progress data-testid="progress" />
        </Timeline>,
        { element: { currentTime: 50, duration: 100 } },
      );

      const { style } = screen.getByTestId("progress");
      for (const property of [
        "width",
        "height",
        "transform",
        "transform-origin",
      ]) {
        expect(style.getPropertyValue(property)).toBe("");
      }
      // Anywhere in the document: React 19 hoists it into `<head>`.
      const rules = document.querySelector(
        'style[href="react-headless-audio-player-progress"]',
      );
      expect(rules?.textContent).toContain("scaleX(var(--progress,0))");
    });

    /**
     * S32. The transition comes from the fill's own stylesheet, keyed on the
     * root's `data-slider`, so a consumer's `transition-property` can point it
     * elsewhere. Inline, only `style` could touch it. Whether it applies, and
     * stops for a drag, is a cascade question jsdom cannot answer; see
     * `testE2E/Timeline/drag-state.spec.ts`.
     */
    it("leaves the transition to the rule it ships", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control>track</Timeline.Control>
          <Timeline.Progress data-testid="progress" />
        </Timeline>,
        { element: { currentTime: 50, duration: 100 } },
      );

      expect(screen.getByTestId("progress").style.transition).toBe("");
    });

    it("lets a consumer's own style win, so it can be dropped", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control>track</Timeline.Control>
          <Timeline.Progress
            data-testid="progress"
            style={{ transition: "none" }}
          />
        </Timeline>,
      );

      expect(screen.getByTestId("progress").style.transition).toBe("none");
    });

    it("should render Timeline.Background with expected styles", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control />
          <Timeline.Background data-testid="background" />
        </Timeline>,
      );

      expect(screen.getByTestId("background")).toHaveStyle({
        gridColumn: "1 / 1",
        gridRow: "1 / 1",
        width: "100%",
        height: "100%",
      });
    });

    it("should render Timeline.Control with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control data-testid="seek">Seek</Timeline.Control>
        </Timeline>,
      );

      const seek = screen.getByTestId("seek");
      expect(seek).toHaveAttribute("role", "slider");
      expect(seek).toHaveAttribute("aria-label", "Timeline slider");
    });

    it("should render Timeline.Thumb with expected attributes", () => {
      renderInPlayer(
        <Timeline>
          <Timeline.Control />
          <Timeline.Thumb data-testid="drag" />
        </Timeline>,
      );

      const drag = screen.getByTestId("drag");
      expect(drag).toHaveAttribute("aria-hidden", "true");
      expect(drag).toHaveAttribute("tabindex", "-1");
    });
  });

  /**
   * A11: no `role="group"` on the root. It wrapped a single control that already
   * carries `role="slider"` and a name, so it announced a group of one.
   */
  it("should render a container with proper styles and no role of its own", () => {
    const { container } = renderInPlayer(
      <Timeline>
        <Timeline.Control>track</Timeline.Control>
      </Timeline>,
    );

    expect(screen.queryByRole("group")).toBeNull();

    const root = container.querySelector('[data-part="root"]') as HTMLElement;
    expect(root).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "minmax(0, 1fr)",
      position: "relative",
    });
    // S8: `width` moved to `styles.css`, where a class can beat it.
    expect(root.style.width).toBe("");
    // S25: no height at all, so a class sizes it as it does the other roots.
    expect(root.style.height).toBe("");
    expect(root).toHaveAttribute("data-part", "root");
  });

  it("should support composition of components", () => {
    renderInPlayer(
      <Timeline>
        <Timeline.Control data-testid="seek">
          <Timeline.Progress data-testid="progress" />
          <Timeline.Background data-testid="background" />
        </Timeline.Control>
        <Timeline.Thumb data-testid="drag" />
      </Timeline>,
    );

    expect(screen.getByTestId("seek")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
    expect(screen.getByTestId("drag")).toBeInTheDocument();
  });

  /**
   * S20: the numbers behind the transforms, as custom properties on the root
   * where every part inherits them.
   */
  it("exposes the fill fraction and the thumb offset as custom properties", () => {
    const { container, element, emit } = renderInPlayer(
      <Timeline>
        <Timeline.Control>track</Timeline.Control>
      </Timeline>,
      { element: { duration: 100 } },
    );
    const root = container.querySelector('[data-part="root"]') as HTMLElement;

    expect(root.style.getPropertyValue("--progress")).toBe("0");
    expect(root.style.getPropertyValue("--offset")).toBe("0px");

    element.currentTime = 25;
    emit("timeupdate");

    expect(root.style.getPropertyValue("--progress")).toBe("0.25");
    expect(root.style.getPropertyValue("--offset")).toMatch(/^[1-9][\d.]*px$/);
  });

  // The timeline's max is the duration, so it takes no `maxValue` prop.
  it("takes its range from the duration atom", () => {
    const { emit, element } = renderInPlayer(
      <Timeline>
        <Timeline.Control data-testid="seek">track</Timeline.Control>
      </Timeline>,
      { element: { duration: 100 } },
    );
    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "100");

    element.duration = 250;
    emit("durationchange");

    expect(screen.getByTestId("seek")).toHaveAttribute("aria-valuemax", "250");
  });
});
