import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import * as mediaKeysModule from "../../src/KeyboardControls/handleMediaKeys";
import * as isDisabledModule from "../../src/Shared/useIsDisabled";
import { PlayerContext } from "../../src/Player/PlayerContext";
import { createPlayerContext } from "../testUtils";
import { renderWithPlayerContext } from "../testComponents";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("ChangePlaybackRate", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockHandleMediaKeys = vi.fn();
  let mockIsDisabled = false;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useHandleMediaKeys
    vi.spyOn(mediaKeysModule, "useHandleMediaKeys").mockReturnValue(
      mockHandleMediaKeys,
    );
    // Mock useIsDisabled
    vi.spyOn(isDisabledModule, "useIsDisabled").mockImplementation(
      () => mockIsDisabled,
    );
  });
  const playerContext = createPlayerContext({
    overrides: {
      playbackRate: 1,
    },
  });

  it("renders a button with correct text", () => {
    renderWithPlayerContext({
      playerContext,
      component: (
        <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>
      ),
    });
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Change Rate");
  });

  it("sets correct aria-label for increase", () => {
    renderWithPlayerContext({
      playerContext,
      component: (
        <ChangePlaybackRate amount={0.25}>Change Rate</ChangePlaybackRate>
      ),
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "Increase playback rate by 0.25x",
    );
  });

  it("sets correct aria-label for decrease", () => {
    renderWithPlayerContext({
      playerContext,
      component: (
        <ChangePlaybackRate amount={-0.25}>Change Rate</ChangePlaybackRate>
      ),
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "Decrease playback rate by 0.25x",
    );
  });

  it("calls handlePlayerAction when clicked", () => {
    // Log to confirm our test is running
    console.log("Running click test");

    // Use a fresh mock
    // Create minimal context with only required values
    const playerContext = createPlayerContext({
      overrides: {
        playbackRate: 1,
      },
    });
    // Render with the fresh context
    renderWithPlayerContext({
      playerContext,
      component: <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    });
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(mockHandleSideEffect).toHaveBeenCalled();
  });

  it("uses the useHandleMediaKeys hook for keyboard events", () => {
    renderWithPlayerContext({
      playerContext,
      component: <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    });
    const button = screen.getByRole("button");

    const keyEvent = { key: "p" };
    fireEvent.keyDown(button, keyEvent);

    expect(mockHandleMediaKeys).toHaveBeenCalled();
  });

  it("is disabled when useIsDisabled returns true", () => {
    mockIsDisabled = true;
    renderWithPlayerContext({
      playerContext,
      component: <ChangePlaybackRate amount={0.25}>Test</ChangePlaybackRate>,
    });
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    // Clicking should not trigger the action
    fireEvent.click(button);
    expect(mockHandlePlayerAction).not.toHaveBeenCalled();
  });

  it("accepts and applies additional props", () => {
    renderWithPlayerContext({
      playerContext,
      component: (
        <ChangePlaybackRate
          amount={0.25}
          data-testid="custom-button"
          className="custom-class"
        >
          Test
        </ChangePlaybackRate>
      ),
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });

  it("calculates new playback rate based on current rate and amount", () => {
    // Make sure button is enabled
    vi.spyOn(isDisabledModule, "useIsDisabled").mockReturnValue(false);
    // Create context with specific playback rate
    const playerContext = createPlayerContext({
      overrides: {
        playbackRate: 2,
      },
    });
    render(
      <PlayerContext.Provider value={playerContext}>
        <ChangePlaybackRate amount={0.5}>Change Rate</ChangePlaybackRate>
      </PlayerContext.Provider>,
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "SET_PLAYBACK_RATE",
      playbackRate: 2.5,
    });
  });
});
