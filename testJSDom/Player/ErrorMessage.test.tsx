import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { ErrorMessage } from "../../src/Player/ErrorMessage";
import { renderWithStore } from "../store/renderWithStore";

// `HAVE_NOTHING` alongside the code, which is what a browser reports for a
// source it cannot play — and what the store now requires before it treats the
// resource as unusable.
const errored = { readyState: 0, error: {} as MediaError };

describe("ErrorMessage", () => {
  it("renders when the element carries an error", () => {
    renderWithStore(<ErrorMessage>Custom error message</ErrorMessage>, {
      element: errored,
    });

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveAttribute("data-part", "error");
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  /**
   * S16. It used to hardcode `class="audio-player-error"`, which nothing in
   * `styles.css` ever matched — a name in the consumer's markup that they did not
   * choose and that did nothing.
   */
  it("adds no class of its own", () => {
    renderWithStore(<ErrorMessage>Broken</ErrorMessage>, {
      element: errored,
    });

    expect(screen.getByRole("alert").className).toBe("");
  });

  it("takes className, style and data attributes", () => {
    renderWithStore(
      <ErrorMessage className="mine" style={{ color: "red" }} data-testid="e">
        Broken
      </ErrorMessage>,
      { element: errored },
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("mine");
    expect(alert).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(alert).toHaveAttribute("data-testid", "e");
  });

  /** The role and the politeness are the component, so neither is overridable. */
  it("keeps its role and politeness whatever the consumer passes", () => {
    renderWithStore(
      <ErrorMessage role="status" aria-live="polite">
        Broken
      </ErrorMessage>,
      { element: errored },
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("returns null when the load succeeded", () => {
    const { container } = renderWithStore(
      <ErrorMessage>Custom error message</ErrorMessage>,
      { element: { readyState: 1, paused: false } },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("maintains proper ARIA attributes", () => {
    renderWithStore(<ErrorMessage>Custom error message</ErrorMessage>, {
      element: errored,
    });

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toHaveAttribute("aria-live", "assertive");

    // The message must be announced, so it must NOT be hidden from AT.
    const visibleContent = screen.getByText("Custom error message");
    expect(visibleContent).not.toHaveAttribute("aria-hidden");
    expect(errorContainer).not.toHaveAttribute("aria-label");
  });

  it("handles different error messages", () => {
    const errorMessage = "Network error occurred";
    renderWithStore(<ErrorMessage>{errorMessage}</ErrorMessage>, {
      element: errored,
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  // A bad src followed by a good one has to recover: `loadedmetadata` sets
  // `loadState` to `"ready"` whatever it held before.
  it("goes away when a failed src is swapped for a good one", () => {
    const { emit, element } = renderWithStore(
      <ErrorMessage>Custom error message</ErrorMessage>,
      { element: { readyState: 0 } },
    );

    element.error = {} as MediaError;
    emit("error");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    element.error = null;
    emit("loadstart");
    element.readyState = 1;
    emit("loadedmetadata");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
