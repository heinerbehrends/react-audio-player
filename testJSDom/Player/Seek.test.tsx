import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Seek } from "../../src/Player/Seek";
import { createPlayerContext, createAudioContext } from "../testUtils";
import { renderWithContexts } from "../testComponents";

const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("Seek", () => {
  const defaultContext = createPlayerContext();

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

      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_TIME_FORWARD",
        value: 10,
      });
    });

    it("seeks backward by specified amount", () => {
      renderSeek(-10);
      fireEvent.click(screen.getByLabelText("Seek backward by 10 seconds"));

      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_TIME_FORWARD",
        value: -10,
      });
    });
  });

  describe("Keyboard behavior", () => {
    it("handles keyboard events", () => {
      renderSeek(10);
      fireEvent.keyDown(screen.getByLabelText("Seek forward by 10 seconds"), {
        key: "ArrowRight",
      });

      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_TIME_FORWARD",
        value: 5,
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
