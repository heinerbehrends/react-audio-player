import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Seek } from "../../src/Player/Seek";
import { createPlayerContext, createAudioContext } from "../testUtils";
import { renderWithContexts } from "../testComponents";

describe("Seek", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockGetPlayerState = vi.fn().mockReturnValue({
    currentTime: 30,
    duration: 100,
    volume: 0.5,
    unmuteVolumeRef: { current: 0.7 },
  });

  const defaultContext = createPlayerContext({
    overrides: {
      handlePlayerAction: mockHandlePlayerAction,
      getPlayerState: mockGetPlayerState,
    },
  });

  const defaultAudioContext = createAudioContext();

  const renderSeek = (amount: number, context = defaultContext) => {
    return renderWithContexts({
      playerContext: context,
      audioContext: defaultAudioContext,
      component: <Seek amount={amount}>Seek {amount}</Seek>,
    });
  };

  describe("Rendering", () => {
    it("renders with correct aria-label", () => {
      renderSeek(10);
      expect(
        screen.getByLabelText("Seek forward by 10 seconds"),
      ).toBeInTheDocument();
    });

    it("renders children", () => {
      renderSeek(10);
      expect(screen.getByText("Seek 10")).toBeInTheDocument();
    });
  });

  describe("Click behavior", () => {
    it("seeks forward by specified amount", () => {
      renderSeek(10);
      fireEvent.click(screen.getByLabelText("Seek forward by 10 seconds"));

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "timeline",
        value: 40, // 30 + 10
      });
    });

    it("seeks backward by specified amount", () => {
      renderSeek(-10);
      fireEvent.click(screen.getByLabelText("Seek backward by 10 seconds"));

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "timeline",
        value: 20, // 30 - 10
      });
    });
  });

  describe("Keyboard behavior", () => {
    it("handles keyboard events", () => {
      renderSeek(10);
      fireEvent.keyDown(screen.getByLabelText("Seek forward by 10 seconds"), {
        key: "ArrowRight",
      });

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 35, // 30 + 5
        component: "timeline",
      });
    });

    it("ignores keyboard events when component is volume", () => {
      renderSeek(10);
      fireEvent.keyDown(screen.getByLabelText("Seek forward by 10 seconds"), {
        key: "ArrowRight",
      });

      // Should not call handlePlayerAction for volume component
      expect(mockHandlePlayerAction).not.toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        component: "volume",
      });
    });
  });

  describe("Disabled state", () => {
    it("is disabled when player is in loading state", () => {
      const context = {
        ...defaultContext,
        playerState: "loading" as const,
      };
      renderSeek(10, context);
      expect(
        screen.getByLabelText("Seek forward by 10 seconds"),
      ).toBeDisabled();
    });

    it("is disabled when player is in error state", () => {
      const context = {
        ...defaultContext,
        playerState: "error" as const,
      };
      renderSeek(10, context);
      expect(
        screen.getByLabelText("Seek forward by 10 seconds"),
      ).toBeDisabled();
    });

    it("is enabled when player is in paused state", () => {
      renderSeek(10);
      expect(
        screen.getByLabelText("Seek forward by 10 seconds"),
      ).not.toBeDisabled();
    });

    it("is enabled when player is in playing state", () => {
      const context = {
        ...defaultContext,
        playerState: "playing" as const,
      };
      renderSeek(10, context);
      expect(
        screen.getByLabelText("Seek forward by 10 seconds"),
      ).not.toBeDisabled();
    });
  });
});
