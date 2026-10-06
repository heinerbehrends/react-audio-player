import { describe, expect, it } from "vitest";
import { TimelineBuffered } from "../../src/index";
import { renderWithStore } from "../store/renderWithStore";
import { timeRanges } from "../store/mediaElementFake";

function bar(container: HTMLElement) {
  return container.querySelector('[data-part="buffered"]') as HTMLElement;
}

const fraction = (container: HTMLElement) =>
  bar(container).style.getPropertyValue("--buffered");

describe("TimelineBuffered", () => {
  it("draws the downloaded range the position is in", () => {
    const { container } = renderWithStore(<TimelineBuffered />, {
      element: {
        duration: 100,
        currentTime: 5,
        buffered: timeRanges([[0, 30]]),
      },
    });

    expect(fraction(container)).toBe("0.3");
  });

  it("grows as the download progresses", () => {
    const { container, element, emit } = renderWithStore(<TimelineBuffered />, {
      element: { duration: 100, buffered: timeRanges([[0, 30]]) },
    });

    element.buffered = timeRanges([[0, 50]]);
    emit("progress");

    expect(fraction(container)).toBe("0.5");
  });

  // Chromium extends `buffered` as it stops loading, with no `progress` after.
  it("catches up on suspend", () => {
    const { container, element, emit } = renderWithStore(<TimelineBuffered />, {
      element: { duration: 100, buffered: timeRanges([[0, 10]]) },
    });

    element.buffered = timeRanges([[0, 33]]);
    emit("suspend");

    expect(fraction(container)).toBe("0.33");
  });

  // After a seek ahead the earlier download is a separate range, and the bar
  // shows the one being played from.
  it("follows a seek into another range", () => {
    const { container, element, emit } = renderWithStore(<TimelineBuffered />, {
      element: {
        duration: 100,
        buffered: timeRanges([
          [0, 30],
          [60, 80],
        ]),
      },
    });

    element.currentTime = 70;
    emit("seeked");

    expect(fraction(container)).toBe("0.8");
  });

  it("is empty outside every range", () => {
    const { container } = renderWithStore(<TimelineBuffered />, {
      element: {
        duration: 100,
        currentTime: 50,
        buffered: timeRanges([[0, 30]]),
      },
    });

    expect(fraction(container)).toBe("0");
  });

  it("is empty on a live stream", () => {
    const { container } = renderWithStore(<TimelineBuffered />, {
      element: {
        duration: Infinity,
        buffered: timeRanges([[0, 30]]),
      },
    });

    expect(fraction(container)).toBe("0");
  });

  it("stacks between the background and the fill", () => {
    const { container } = renderWithStore(<TimelineBuffered />);

    expect(bar(container).style.zIndex).toBe("1");
  });

  it("lets a style override the default", () => {
    const { container } = renderWithStore(
      <TimelineBuffered style={{ opacity: 0.5 }} className="mine" />,
    );

    expect(bar(container)).toHaveClass("mine");
    expect(bar(container).style.opacity).toBe("0.5");
  });
});
