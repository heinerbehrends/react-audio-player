import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MuteButton } from "../../src/Player/MuteButton";
import type { VolumeState } from "../../src/Player/PlayerContext";
import "@testing-library/jest-dom";
import { createPlayerContext, createAudioContext } from "../testUtils";
import { renderWithContexts, renderWithPlayerContext } from "../testComponents";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("MuteButton", () => {
  const mockPlayerContext = createPlayerContext();

  const mockAudioContext = createAudioContext();

  describe("MuteButtonComponent", () => {
    it.each([
      ["high", "Mute", "false", false],
      ["low", "Mute", "false", false],
      ["muted", "Unmute", "true", true],
    ])("renders correctly in %s state", (state, name, pressed, isMuted) => {
      const context = {
        ...mockPlayerContext,
        volumeState: state as VolumeState,
        isMuted,
        getPlayerState: vi.fn(() => ({
          volumeState: state as VolumeState,
          isMuted,
        })),
      };

      renderWithContexts({
        playerContext: context,
        audioContext: mockAudioContext,
        component: (
          <MuteButton>
            <span>Mute Icon</span>
          </MuteButton>
        ),
      });
      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("aria-pressed", pressed);
    });

    it("updates aria-pressed when muted", () => {
      renderWithContexts({
        playerContext: mockPlayerContext,
        audioContext: mockAudioContext,
        component: (
          <MuteButton>
            <span>Mute Icon</span>
          </MuteButton>
        ),
      });
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
      });
    });

    it("handles keyboard events", () => {
      renderWithContexts({
        playerContext: mockPlayerContext,
        audioContext: mockAudioContext,
        component: (
          <MuteButton>
            <span>Mute Icon</span>
          </MuteButton>
        ),
      });
      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "m" });
      expect(mockHandleSideEffect).toHaveBeenCalled();
    });
  });

  describe("Muted subcomponent", () => {
    it("renders children when volumeState is muted", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "muted" },
        component: (
          <MuteButton.Muted>
            <span>Muted Icon</span>
          </MuteButton.Muted>
        ),
      });
      expect(screen.getByText("Muted Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not muted", () => {
      const { container } = renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "high" },
        component: (
          <MuteButton.Muted>
            <span>Muted Icon</span>
          </MuteButton.Muted>
        ),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("LowVolume subcomponent", () => {
    it("renders children when volumeState is low", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "low" },
        component: (
          <MuteButton.LowVolume>
            <span>Low Volume Icon</span>
          </MuteButton.LowVolume>
        ),
      });
      expect(screen.getByText("Low Volume Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not low", () => {
      const { container } = renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "high" },
        component: (
          <MuteButton.LowVolume>
            <span>Low Volume Icon</span>
          </MuteButton.LowVolume>
        ),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("HighVolume subcomponent", () => {
    it("renders children when volumeState is high", () => {
      renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "high" },
        component: (
          <MuteButton.HighVolume>
            <span>High Volume Icon</span>
          </MuteButton.HighVolume>
        ),
      });
      expect(screen.getByText("High Volume Icon")).toBeInTheDocument();
    });

    it("returns null when volumeState is not high", () => {
      const { container } = renderWithPlayerContext({
        playerContext: { ...mockPlayerContext, volumeState: "low" },
        component: (
          <MuteButton.HighVolume>
            <span>High Volume Icon</span>
          </MuteButton.HighVolume>
        ),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("useToggleMute hook", () => {
    it("handles mute toggle correctly", () => {
      renderWithContexts({
        playerContext: mockPlayerContext,
        audioContext: mockAudioContext,
        component: (
          <MuteButton>
            <span>Mute Icon</span>
          </MuteButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Mute" });

      fireEvent.click(button);

      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
      });
    });

    it("handles unmute toggle correctly", () => {
      renderWithContexts({
        playerContext: mockPlayerContext,
        audioContext: mockAudioContext,
        component: (
          <MuteButton>
            <span>Mute Icon</span>
          </MuteButton>
        ),
      });
      const button = screen.getByRole("button", { name: "Mute" });

      // First click to mute
      fireEvent.click(button);
      // Second click to unmute
      fireEvent.click(button);

      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
      });
    });
  });
});
