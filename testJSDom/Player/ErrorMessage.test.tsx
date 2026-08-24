import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { ErrorMessage } from "../../src/Player/ErrorMessage";
import { renderWithStore } from "../store/renderWithStore";

const errored = { error: {} as MediaError };

describe("ErrorMessage", () => {
  it("renders when the element carries an error", () => {
    renderWithStore(<ErrorMessage>Custom error message</ErrorMessage>, {
      element: errored,
    });

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass("audio-player-error");
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
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

    const visibleContent = screen.getByText("Custom error message");
    expect(visibleContent).toHaveAttribute("aria-hidden", "true");
  });

  it("handles different error messages", () => {
    const errorMessage = "Network error occurred";
    renderWithStore(<ErrorMessage>{errorMessage}</ErrorMessage>, {
      element: errored,
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  // The live bug the `loadState` machine fixes: `AUDIO_FILE_ERROR` set
  // `playerState: "error"` permanently, and `AUDIO_FILE_LOADED` only recovered
  // from `"loading"`, so a bad src followed by a good one stayed broken.
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
