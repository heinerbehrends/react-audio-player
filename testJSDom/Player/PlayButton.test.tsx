import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { PlayButton } from "../../src/Player/PlayButton";
import type { PlayerState } from "../../src/Player/PlayerContext";
import { createPlayerContext } from "../testUtils";
import { renderWithPlayerContext } from "../testComponents";
import "@testing-library/jest-dom";

describe("PlayButton", () => {
  const mockPlayerContext = createPlayerContext();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PlayButtonComponent", () => {
    it.each([
      ["paused", "Play audio", "false", false],
      ["playing", "Pause audio", "true", false],
      ["loading", "Loading audio", "false", true],
      ["error", "Error loading audio", "false", true],
    ])("renders correctly in %s state", (state, name, pressed, disabled) => {
      renderWithPlayerContext({
        playerContext: {
          ...mockPlayerContext,
          playerState: state as PlayerState,
        },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button");

      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("aria-pressed", pressed);
      if (disabled) {
        expect(button).toBeDisabled();
      }
    });

    it("handles click events", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "paused" },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Play audio" });
      fireEvent.click(button);
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });

    it("handles keyboard events", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "paused" },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Play audio" });
      fireEvent.keyDown(button, { key: "p" });
      expect(mockPlayerContext.handlePlayerAction).toHaveBeenCalled();
    });
  });

  describe("Playing subcomponent", () => {
    it("renders children when player state is playing", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "playing" },
        component: (
          <PlayButton.Playing>
            <span>Playing Icon</span>
          </PlayButton.Playing>
        ),
      });
      expect(screen.getByText("Playing Icon")).toBeInTheDocument();
    });

    it("returns null when player state is not playing", () => {
      const { container } = renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "paused" },
        component: (
          <PlayButton.Playing>
            <span>Playing Icon</span>
          </PlayButton.Playing>
        ),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Paused subcomponent", () => {
    it("renders children when player state is not playing", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "paused" },
        component: (
          <PlayButton.Paused>
            <span>Paused Icon</span>
          </PlayButton.Paused>
        ),
      });
      expect(screen.getByText("Paused Icon")).toBeInTheDocument();
    });

    it("returns null when player state is playing", () => {
      const { container } = renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "playing" },
        component: (
          <PlayButton.Paused>
            <span>Paused Icon</span>
          </PlayButton.Paused>
        ),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("usePlayButtonProps hook", () => {
    it("returns correct props for playing state", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "playing" },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Pause audio" });
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).not.toBeDisabled();
    });

    it("returns correct props for loading state", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "loading" },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Loading audio" });
      expect(button).toBeDisabled();
    });

    it("returns correct props for error state", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, playerState: "error" },
        component: (
          <PlayButton>
            <span>Play Icon</span>
          </PlayButton>
        ),
      });
      const button = screen.getByRole("button", {
        name: "Error loading audio",
      });
      expect(button).toBeDisabled();
    });
  });
});
