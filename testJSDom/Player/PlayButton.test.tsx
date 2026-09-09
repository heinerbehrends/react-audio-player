import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { PlayButton } from "../../src/Player/PlayButton";
import { renderWithStore } from "../store/renderWithStore";
import type { MediaFields } from "../store/mediaElementFake";
import "@testing-library/jest-dom";

/** The four player states are element states, so each row sets up an element. */
const states: Record<string, Partial<MediaFields>> = {
  paused: { readyState: 1, paused: true },
  playing: { readyState: 1, paused: false },
  loading: { readyState: 0 },
  error: { readyState: 0, error: {} as MediaError },
};

describe("PlayButton", () => {
  describe("PlayButtonComponent", () => {
    /**
     * Only the error state disables. Loading renames — `play()` at
     * `readyState: 0` is legal and the browser queues it, so suppressing the
     * click would drop the first interaction most users attempt, on every
     * playlist advance as well as at startup.
     */
    it.each([
      ["paused", "Play audio", undefined],
      ["playing", "Pause audio", undefined],
      ["loading", "Loading audio", undefined],
      ["error", "Error loading audio", "true"],
    ])("renders correctly in %s state", (state, name, ariaDisabled) => {
      renderWithStore(
        <PlayButton>
          <span>Play Icon</span>
        </PlayButton>,
        { element: states[state] },
      );
      const button = screen.getByRole("button");

      expect(button).toHaveAccessibleName(name);
      // A4: the name also carries `loading` and `error`, which `aria-pressed`
      // could not.
      expect(button).not.toHaveAttribute("aria-pressed");
      // Never native `disabled`: the tab stop has to survive a load-state
      // change under a focused button (A7).
      expect(button).not.toBeDisabled();
      if (ariaDisabled) {
        expect(button).toHaveAttribute("aria-disabled", ariaDisabled);
      } else {
        expect(button).not.toHaveAttribute("aria-disabled");
      }
    });

    it("plays a paused element on click", () => {
      const { element } = renderWithStore(
        <PlayButton>
          <span>Play Icon</span>
        </PlayButton>,
        { element: states["paused"] },
      );
      fireEvent.click(screen.getByRole("button", { name: "Play audio" }));

      expect(element.play).toHaveBeenCalled();
    });

    it("pauses a playing element on click", () => {
      const { element } = renderWithStore(
        <PlayButton>
          <span>Play Icon</span>
        </PlayButton>,
        { element: states["playing"] },
      );
      fireEvent.click(screen.getByRole("button", { name: "Pause audio" }));

      expect(element.pause).toHaveBeenCalled();
    });

    it("handles keyboard events", () => {
      const { element } = renderWithStore(
        <PlayButton>
          <span>Play Icon</span>
        </PlayButton>,
        { element: states["paused"] },
      );
      fireEvent.keyDown(screen.getByRole("button", { name: "Play audio" }), {
        key: "p",
      });

      expect(element.play).toHaveBeenCalled();
    });
  });

  describe("Playing subcomponent", () => {
    it("renders children while playing", () => {
      renderWithStore(
        <PlayButton.Playing>
          <span>Playing Icon</span>
        </PlayButton.Playing>,
        { element: states["playing"] },
      );
      expect(screen.getByText("Playing Icon")).toBeInTheDocument();
    });

    it("returns null when not playing", () => {
      const { container } = renderWithStore(
        <PlayButton.Playing>
          <span>Playing Icon</span>
        </PlayButton.Playing>,
        { element: states["paused"] },
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Paused subcomponent", () => {
    it("renders children when not playing", () => {
      renderWithStore(
        <PlayButton.Paused>
          <span>Paused Icon</span>
        </PlayButton.Paused>,
        { element: states["paused"] },
      );
      expect(screen.getByText("Paused Icon")).toBeInTheDocument();
    });

    it("returns null while playing", () => {
      const { container } = renderWithStore(
        <PlayButton.Paused>
          <span>Paused Icon</span>
        </PlayButton.Paused>,
        { element: states["playing"] },
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  // A `src` swap re-primes `paused` rather than toggling it, so the button
  // cannot end up showing Pause on a paused element.
  it("stays correct across a src swap while playing", () => {
    const { emit, element } = renderWithStore(
      <PlayButton>
        <span>Play Icon</span>
      </PlayButton>,
      { element: states["playing"] },
    );
    expect(screen.getByRole("button")).toHaveAccessibleName("Pause audio");

    element.paused = true;
    element.readyState = 0;
    emit("emptied");

    expect(screen.getByRole("button")).toHaveAccessibleName("Loading audio");
    // The name carries the state; the button stays pressable, which is what
    // makes a playlist advance work — the swap re-enters loading every time.
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled");

    fireEvent.click(screen.getByRole("button"));
    expect(element.play).toHaveBeenCalled();
  });
});
