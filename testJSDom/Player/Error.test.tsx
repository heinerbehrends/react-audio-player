import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Error } from "../../src/Player/Error";
import { renderWithPlayerContext } from "../testComponents";
import { createPlayerContext } from "../testUtils";

describe("Error", () => {
  const mockPlayerContext = createPlayerContext({
    overrides: {
      playerState: "error" as const,
    },
  });

  it("renders error message when player state is 'error'", () => {
    renderWithPlayerContext({
      playerContext: mockPlayerContext,
      component: <Error>Custom error message</Error>,
    });

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass("audio-player-error");
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("includes screen reader text for accessibility", () => {
    renderWithPlayerContext({
      playerContext: mockPlayerContext,
      component: <Error>Custom error message</Error>,
    });

    const srOnly = screen.getByText("There was an error loading the audio");
    expect(srOnly).toHaveClass("sr-only");
  });

  it("returns null when player state is not 'error'", () => {
    const { container } = renderWithPlayerContext({
      playerContext: { ...mockPlayerContext, playerState: "playing" },
      component: <Error>Custom error message</Error>,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("maintains proper ARIA attributes", () => {
    renderWithPlayerContext({
      playerContext: mockPlayerContext,
      component: <Error>Custom error message</Error>,
    });

    const errorContainer = screen.getByRole("alert");
    expect(errorContainer).toHaveAttribute("aria-live", "assertive");

    const visibleContent = screen.getByText("Custom error message");
    expect(visibleContent).toHaveAttribute("aria-hidden", "true");
  });

  it("handles different error messages", () => {
    const errorMessage = "Network error occurred";
    renderWithPlayerContext({
      playerContext: mockPlayerContext,
      component: <Error>{errorMessage}</Error>,
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
