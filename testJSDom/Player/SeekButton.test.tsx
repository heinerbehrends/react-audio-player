import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { SeekButton } from "../../src/Player/SeekButton";
import { renderWithStore } from "../store/renderWithStore";
import { labels } from "../../testE2E/test-utils";
import type { MediaFields } from "../store/mediaElementFake";

describe("Seek", () => {
  const renderSeek = (amount: number, element: Partial<MediaFields> = {}) =>
    renderWithStore(<SeekButton amount={amount}>Seek {amount}</SeekButton>, {
      element,
    });

  describe("Rendering", () => {
    it("renders with correct aria-label", () => {
      renderSeek(10);
      expect(screen.getByLabelText(labels.seekForward)).toBeInTheDocument();
    });

    it("renders children", () => {
      renderSeek(10);
      expect(screen.getByText("Seek 10")).toBeInTheDocument();
    });
  });

  // The assertions land on the element, not on a mocked hook: `send` writes
  // through `handleSideEffect` to the attached fake.
  describe("Click behavior", () => {
    it("seeks forward by specified amount", () => {
      const { element } = renderSeek(10, { currentTime: 30 });
      fireEvent.click(screen.getByLabelText(labels.seekForward));

      expect(element.currentTime).toBe(40);
    });

    it("seeks backward by specified amount", () => {
      const { element } = renderSeek(-10, { currentTime: 30 });
      fireEvent.click(screen.getByLabelText(labels.seekBackward));

      expect(element.currentTime).toBe(20);
    });
  });

  describe("Keyboard behavior", () => {
    it("handles keyboard events", () => {
      const { element } = renderSeek(10, { currentTime: 30 });
      fireEvent.keyDown(screen.getByLabelText(labels.seekForward), {
        key: "ArrowRight",
      });

      expect(element.currentTime).toBe(35);
    });
  });

  describe("Disabled state", () => {
    // A7: a natively disabled button leaves the tab order, dropping focus to
    // `<body>` when the load state changes under it.
    it("is aria-disabled while loading", () => {
      renderSeek(10, { readyState: 0 });
      const button = screen.getByLabelText(labels.seekForward);
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });

    it("is aria-disabled on error", () => {
      renderSeek(10, { error: {} as MediaError });
      const button = screen.getByLabelText(labels.seekForward);
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).not.toBeDisabled();
    });

    it("does not seek while disabled", () => {
      const { element } = renderSeek(10, { readyState: 0, currentTime: 30 });
      fireEvent.click(screen.getByLabelText(labels.seekForward));
      expect(element.currentTime).toBe(30);
    });

    it("is enabled when paused", () => {
      renderSeek(10, { paused: true });
      expect(screen.getByLabelText(labels.seekForward)).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("is enabled when playing", () => {
      renderSeek(10, { paused: false });
      expect(screen.getByLabelText(labels.seekForward)).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });
});
