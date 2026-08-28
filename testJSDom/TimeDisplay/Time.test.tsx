import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import "@testing-library/jest-dom";
import { createTestStore } from "../store/createTestStore";
import { renderWithStore } from "../store/renderWithStore";
import type { TimeDisplay } from "../../src/store/createPlayerStore";

/** `timeDisplay` is the one writable atom, so a test sets it directly. */
function withTimeDisplay(timeDisplay: TimeDisplay) {
  const harness = createTestStore({ readyState: 1, duration: 120 });
  harness.store.timeDisplay.set(timeDisplay);
  return harness;
}

describe("Time", () => {
  it("hides Elapsed when showing remaining time", () => {
    renderWithStore(<Time.Elapsed />, {
      testStore: withTimeDisplay("remaining"),
    });
    expect(screen.queryByLabelText("elapsed")).not.toBeInTheDocument();
  });

  it("hides Remaining when showing elapsed time", () => {
    renderWithStore(<Time.Remaining />, {
      testStore: withTimeDisplay("elapsed"),
    });
    expect(screen.queryByLabelText("remaining")).not.toBeInTheDocument();
  });

  it.each([
    ["remaining", "Show time elapsed"],
    ["elapsed", "Show time remaining"],
  ])("is named for what it will do while showing %s", (shown, name) => {
    renderWithStore(<Time.Toggle>Toggle</Time.Toggle>, {
      testStore: withTimeDisplay(shown as TimeDisplay),
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName(name);
    // One state channel, the name -- see A4. `aria-pressed` beside a name that
    // already says which way the toggle will go announces the fact twice.
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("flips the atom on click, so the two halves swap", () => {
    const testStore = withTimeDisplay("elapsed");
    renderWithStore(
      <Time.Toggle>
        Toggle
        <Time.Elapsed />
        <Time.Remaining />
      </Time.Toggle>,
      { testStore },
    );
    expect(screen.getByLabelText("elapsed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(testStore.store.timeDisplay.get()).toBe("remaining");
    expect(screen.queryByLabelText("elapsed")).not.toBeInTheDocument();
    expect(screen.getByLabelText("remaining")).toBeInTheDocument();
  });

  it("renders Duration from the duration atom", () => {
    renderWithStore(<Time.Duration />, {
      element: { readyState: 1, duration: 120 },
    });
    expect(screen.getByLabelText("duration")).toHaveTextContent("2:00");
  });

  it("follows a durationchange", () => {
    const { element, emit } = renderWithStore(<Time.Duration />, {
      element: { readyState: 1, duration: 120 },
    });

    element.duration = 121;
    emit("durationchange");

    expect(screen.getByLabelText("duration")).toHaveTextContent("2:01");
  });
});
