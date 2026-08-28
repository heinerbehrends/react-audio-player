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

/** The parts carry no accessible name of their own — `data-part` is the hook. */
const part = (name: string) =>
  document.querySelector(`[data-part="${name}"]`) as HTMLElement | null;

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
    // A4: with the name already saying which way the toggle goes,
    // `aria-pressed` announces the fact twice.
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
    expect(part("elapsed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(testStore.store.timeDisplay.get()).toBe("remaining");
    expect(part("elapsed")).toBeNull();
    expect(part("remaining")).toBeInTheDocument();
    expect(part("remaining")).toHaveTextContent("-");
  });

  /**
   * A12. The clock carried `aria-label="elapsed"`, which *replaces* the accessible
   * name — so a screen reader read "elapsed" and never the time. `<time>` also
   * maps to no ARIA role, and naming a generic element is not reliably announced,
   * so the label was unreliable in both directions. The text is the name now.
   */
  it.each([
    ["elapsed", "elapsed", <Time.Elapsed key="e" />],
    ["remaining", "remaining", <Time.Remaining key="r" />],
    ["duration", "elapsed", <Time.Duration key="d" />],
  ] as const)(
    "leaves the %s time as its own accessible name",
    (name, display, ui) => {
      renderWithStore(ui, { testStore: withTimeDisplay(display) });

      expect(part(name)).toBeInTheDocument();
      expect(part(name)).not.toHaveAttribute("aria-label");
      expect(screen.queryByLabelText(name)).toBeNull();
    },
  );

  /** S16: they took no props at all, so nothing could be styled or targeted. */
  it.each([
    ["elapsed", "elapsed", <Time.Elapsed key="e" className="clock" />],
    ["remaining", "remaining", <Time.Remaining key="r" className="clock" />],
    ["duration", "elapsed", <Time.Duration key="d" className="clock" />],
  ] as const)("passes props through on %s", (name, display, ui) => {
    renderWithStore(ui, { testStore: withTimeDisplay(display) });

    expect(part(name)).toHaveClass("clock");
  });

  /**
   * The resting state after a track finishes, now that the element parks at the
   * end instead of being rewound. A signed "-0:00" reads as a glitch.
   */
  it("drops the sign once nothing is remaining", () => {
    const harness = createTestStore({
      readyState: 1,
      duration: 120,
      currentTime: 120,
    });
    harness.store.timeDisplay.set("remaining");
    renderWithStore(<Time.Remaining />, { testStore: harness });

    expect(part("remaining")).toHaveTextContent("0:00");
    expect(part("remaining")?.textContent).not.toContain("-");
  });

  it("renders Duration from the duration atom", () => {
    renderWithStore(<Time.Duration />, {
      element: { readyState: 1, duration: 120 },
    });
    expect(part("duration")).toHaveTextContent("2:00");
  });

  it("follows a durationchange", () => {
    const { element, emit } = renderWithStore(<Time.Duration />, {
      element: { readyState: 1, duration: 120 },
    });

    element.duration = 121;
    emit("durationchange");

    expect(part("duration")).toHaveTextContent("2:01");
  });
});
