import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { Seek } from "../../src/Player/Seek";
import { renderWithStore } from "../store/renderWithStore";
import { labels } from "../../testE2E/test-utils";
import type { MediaFields } from "../store/mediaElementFake";

describe("Seek", () => {
  const renderSeek = (amount: number, element: Partial<MediaFields> = {}) =>
    renderWithStore(<Seek amount={amount}>Seek {amount}</Seek>, { element });

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

  // The assertions land on the element now, not on a mocked hook: `send` writes
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
    it("is disabled while loading", () => {
      renderSeek(10, { readyState: 0 });
      expect(screen.getByLabelText(labels.seekForward)).toBeDisabled();
    });

    it("is disabled on error", () => {
      renderSeek(10, { error: {} as MediaError });
      expect(screen.getByLabelText(labels.seekForward)).toBeDisabled();
    });

    it("is enabled when paused", () => {
      renderSeek(10, { paused: true });
      expect(screen.getByLabelText(labels.seekForward)).not.toBeDisabled();
    });

    it("is enabled when playing", () => {
      renderSeek(10, { paused: false });
      expect(screen.getByLabelText(labels.seekForward)).not.toBeDisabled();
    });
  });
});
