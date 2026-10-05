import { describe, it, expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import "@testing-library/jest-dom";
import { createTestStore } from "../store/createTestStore";
import { renderWithStore } from "../store/renderWithStore";

const loaded = () => createTestStore({ readyState: 1, duration: 120 });

/** The parts carry no accessible name of their own — `data-part` is the hook. */
const part = (name: string) =>
  document.querySelector(`[data-part="${name}"]`) as HTMLElement | null;

describe("Time", () => {
  /** Each readout always shows its own number; only the toggle switches. */
  it("shows Elapsed and Remaining on their own, with no toggle", () => {
    renderWithStore(
      <>
        <Time.Elapsed />
        <Time.Remaining />
      </>,
      { testStore: loaded() },
    );

    expect(part("elapsed")).toHaveTextContent("0:00");
    expect(part("remaining")).toHaveTextContent("-2:00");
  });

  it.each([
    ["remaining", "-2:00 remaining, show time elapsed"],
    ["elapsed", "0:00 elapsed, show time remaining"],
  ] as const)(
    "is named by the time shown, then what it will do, while showing %s",
    (shown, name) => {
      renderWithStore(<Time.Toggle defaultValue={shown} />, {
        testStore: loaded(),
      });
      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("data-state", shown);
      // A4: with the name already saying which way the toggle goes,
      // `aria-pressed` announces the fact twice.
      expect(button).not.toHaveAttribute("aria-pressed");
    },
  );

  it("starts on elapsed and swaps readouts on click", () => {
    renderWithStore(<Time.Toggle />, { testStore: loaded() });
    expect(part("elapsed")).toBeInTheDocument();
    expect(part("remaining")).toBeNull();

    fireEvent.click(screen.getByRole("button"));

    expect(part("elapsed")).toBeNull();
    expect(part("remaining")).toHaveTextContent("-2:00");
  });

  it("starts on the readout defaultValue names, and reads it only once", () => {
    const { rerender } = renderWithStore(
      <Time.Toggle defaultValue="remaining" />,
      { testStore: loaded() },
    );
    expect(part("remaining")).toBeInTheDocument();

    rerender(<Time.Toggle defaultValue="elapsed" />);

    expect(part("remaining")).toBeInTheDocument();
    expect(part("elapsed")).toBeNull();
  });

  /**
   * S30. The readout was picked from the bag's `data-state`, which a consumer's
   * own replaces: `data-state="on"` pinned it to remaining while the name
   * flipped on every click.
   */
  it("keeps the readout with the name under a data-state of the caller's", () => {
    renderWithStore(<Time.Toggle data-state="on" />, { testStore: loaded() });
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName("0:00 elapsed, show time remaining");
    expect(part("elapsed")).toBeInTheDocument();
    expect(part("remaining")).toBeNull();

    fireEvent.click(button);

    expect(button).toHaveAccessibleName("-2:00 remaining, show time elapsed");
    expect(part("elapsed")).toBeNull();
    expect(part("remaining")).toHaveTextContent("-2:00");
  });

  it("keeps each toggle's choice its own", () => {
    renderWithStore(
      <>
        <Time.Toggle data-testid="first" />
        <Time.Toggle data-testid="second" />
      </>,
      { testStore: loaded() },
    );

    fireEvent.click(screen.getByTestId("first"));

    expect(screen.getByTestId("first")).toHaveAttribute(
      "data-state",
      "remaining",
    );
    expect(screen.getByTestId("second")).toHaveAttribute(
      "data-state",
      "elapsed",
    );
  });

  /**
   * A12. The clock carried `aria-label="elapsed"`, which *replaces* the accessible
   * name — so a screen reader read "elapsed" and never the time. `<time>` also
   * maps to no ARIA role, and naming a generic element is not reliably announced,
   * so the label was unreliable in both directions. The text is the name now.
   */
  it.each([
    ["elapsed", <Time.Elapsed key="e" />],
    ["remaining", <Time.Remaining key="r" />],
    ["duration", <Time.Duration key="d" />],
  ] as const)("leaves the %s time as its own accessible name", (name, ui) => {
    renderWithStore(ui, { testStore: loaded() });

    expect(part(name)).toBeInTheDocument();
    expect(part(name)).not.toHaveAttribute("aria-label");
    expect(screen.queryByLabelText(name)).toBeNull();
  });

  /** S16: they took no props at all, so nothing could be styled or targeted. */
  it.each([
    ["elapsed", <Time.Elapsed key="e" className="clock" />],
    ["remaining", <Time.Remaining key="r" className="clock" />],
    ["duration", <Time.Duration key="d" className="clock" />],
  ] as const)("passes props through on %s", (name, ui) => {
    renderWithStore(ui, { testStore: loaded() });

    expect(part(name)).toHaveClass("clock");
  });

  /**
   * A type-level assertion, checked by `tsc` rather than at runtime: the
   * readout's own text occupies the children slot, so `children` was accepted
   * and silently discarded until it was omitted from `TimeProps`. Drop that
   * `Omit` and these `@ts-expect-error`s go unused, which fails the type-check.
   */
  it("rejects children at the type level", () => {
    const rejected = (
      <>
        {/* @ts-expect-error children belong to the readout, not the caller */}
        <Time.Elapsed>12:00</Time.Elapsed>
        {/* @ts-expect-error — and it collides with the text at runtime */}
        <Time.Duration dangerouslySetInnerHTML={{ __html: "12:00" }} />
        {/* @ts-expect-error the toggle renders its own readout */}
        <Time.Toggle>
          <Time.Elapsed />
        </Time.Toggle>
      </>
    );

    expect(rejected).toBeTruthy();
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
