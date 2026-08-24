import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MuteButton } from "../../src/Player/MuteButton";
import "@testing-library/jest-dom";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";

/**
 * `volumeState` is a derivation now, so each row is the element state it derives
 * from: the 0.5 boundary and the "muted wins whatever the volume" rule.
 */
const volumeStates: Record<string, Partial<MediaFields>> = {
  high: { readyState: 1, volume: 0.8, muted: false },
  low: { readyState: 1, volume: 0.4, muted: false },
  muted: { readyState: 1, volume: 0.8, muted: true },
};

const renderMuteButton = (
  ui: React.ReactElement,
  element: Partial<MediaFields>,
) => renderWithStore(ui, { element });

describe("MuteButton", () => {
  describe("MuteButtonComponent", () => {
    it.each([
      ["high", "Mute", "false"],
      ["low", "Mute", "false"],
      ["muted", "Unmute", "true"],
    ])("renders correctly in %s state", (state, name, pressed) => {
      renderMuteButton(
        <MuteButton>
          <span>Mute Icon</span>
        </MuteButton>,
        volumeStates[state]!,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName(name);
      expect(button).toHaveAttribute("aria-pressed", pressed);
    });

    it("mutes the element on click", () => {
      const { element } = renderMuteButton(
        <MuteButton>
          <span>Mute Icon</span>
        </MuteButton>,
        volumeStates["high"]!,
      );
      fireEvent.click(screen.getByRole("button"));

      expect(element.muted).toBe(true);
    });

    it("handles keyboard events", () => {
      const { element } = renderMuteButton(
        <MuteButton>
          <span>Mute Icon</span>
        </MuteButton>,
        volumeStates["high"]!,
      );
      fireEvent.keyDown(screen.getByRole("button"), { key: "m" });

      expect(element.muted).toBe(true);
    });

    it("reflects the element after a volumechange", () => {
      const { element, emit } = renderMuteButton(
        <MuteButton>
          <span>Mute Icon</span>
        </MuteButton>,
        volumeStates["high"]!,
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      element.muted = true;
      emit("volumechange");

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button")).toHaveAccessibleName("Unmute");
    });
  });

  describe("Muted subcomponent", () => {
    it("renders children when the element is muted", () => {
      renderMuteButton(
        <MuteButton.Muted>
          <span>Muted Icon</span>
        </MuteButton.Muted>,
        volumeStates["muted"]!,
      );
      expect(screen.getByText("Muted Icon")).toBeInTheDocument();
    });

    it("returns null when it is not", () => {
      const { container } = renderMuteButton(
        <MuteButton.Muted>
          <span>Muted Icon</span>
        </MuteButton.Muted>,
        volumeStates["high"]!,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders for a volume a hair off zero, which the UI treats as muted", () => {
      renderMuteButton(
        <MuteButton.Muted>
          <span>Muted Icon</span>
        </MuteButton.Muted>,
        { readyState: 1, volume: 0.0005, muted: false },
      );
      expect(screen.getByText("Muted Icon")).toBeInTheDocument();
    });
  });

  describe("LowVolume subcomponent", () => {
    it("renders children below 0.5", () => {
      renderMuteButton(
        <MuteButton.LowVolume>
          <span>Low Volume Icon</span>
        </MuteButton.LowVolume>,
        volumeStates["low"]!,
      );
      expect(screen.getByText("Low Volume Icon")).toBeInTheDocument();
    });

    it("returns null at or above 0.5", () => {
      const { container } = renderMuteButton(
        <MuteButton.LowVolume>
          <span>Low Volume Icon</span>
        </MuteButton.LowVolume>,
        volumeStates["high"]!,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("HighVolume subcomponent", () => {
    it("renders children at or above 0.5", () => {
      renderMuteButton(
        <MuteButton.HighVolume>
          <span>High Volume Icon</span>
        </MuteButton.HighVolume>,
        volumeStates["high"]!,
      );
      expect(screen.getByText("High Volume Icon")).toBeInTheDocument();
    });

    it("returns null below 0.5", () => {
      const { container } = renderMuteButton(
        <MuteButton.HighVolume>
          <span>High Volume Icon</span>
        </MuteButton.HighVolume>,
        volumeStates["low"]!,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null when muted, whatever the volume", () => {
      const { container } = renderMuteButton(
        <MuteButton.HighVolume>
          <span>High Volume Icon</span>
        </MuteButton.HighVolume>,
        volumeStates["muted"]!,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("useToggleMute hook", () => {
    it("round-trips mute and unmute", () => {
      const { element } = renderMuteButton(
        <MuteButton>
          <span>Mute Icon</span>
        </MuteButton>,
        volumeStates["high"]!,
      );
      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(element.muted).toBe(true);

      fireEvent.click(button);
      expect(element.muted).toBe(false);
    });
  });
});
