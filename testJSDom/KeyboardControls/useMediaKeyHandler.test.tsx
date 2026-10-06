import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMediaKeyHandler, usePlayButtonProps } from "../../src/index";
import { renderWithStore } from "../store/renderWithStore";

function LibraryButton() {
  return <button {...usePlayButtonProps()}>library</button>;
}

/** A player of the consumer's own, with the handler on its root. */
function Player() {
  const onKeyDown = useMediaKeyHandler();
  return (
    <div onKeyDown={onKeyDown}>
      <button>custom</button>
      <LibraryButton />
      <input aria-label="search" />
      <textarea aria-label="notes" />
      <div aria-label="editor" contentEditable suppressContentEditableWarning />
    </div>
  );
}

const loaded = { element: { readyState: 1, paused: true } };

/**
 * The shortcuts on controls of the consumer's own. Keydown bubbles, so the
 * same handler covers one element or a whole container.
 */
describe("useMediaKeyHandler", () => {
  it("runs the shortcuts from a custom control inside the container", () => {
    const { element } = renderWithStore(<Player />, loaded);

    const notPrevented = fireEvent.keyDown(screen.getByText("custom"), {
      key: "k",
    });

    expect(element.play).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });

  // A toggle run twice would undo itself; the library control stops the key.
  it("runs a key once when a library control inside already handled it", () => {
    const { element } = renderWithStore(<Player />, loaded);

    fireEvent.keyDown(screen.getByText("library"), { key: "m" });

    expect(element.muted).toBe(true);
  });

  it.each(["search", "notes", "editor"])(
    "leaves keys typed into the %s field alone",
    (name) => {
      const { element } = renderWithStore(<Player />, loaded);
      // jsdom does not implement `isContentEditable`; browsers do.
      Object.defineProperty(
        screen.getByLabelText("editor"),
        "isContentEditable",
        {
          value: true,
        },
      );

      const notPrevented = fireEvent.keyDown(screen.getByLabelText(name), {
        key: "k",
      });

      expect(element.play).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    },
  );

  it("leaves modifier combinations to the browser", () => {
    const { element } = renderWithStore(<Player />, loaded);

    fireEvent.keyDown(screen.getByText("custom"), { key: "k", ctrlKey: true });

    expect(element.play).not.toHaveBeenCalled();
  });

  it("follows customKeyboardShortcuts", () => {
    const { element } = renderWithStore(<Player />, {
      ...loaded,
      customKeyboardShortcuts: { k: null, x: { type: "TOGGLE_PLAY" } },
    });

    fireEvent.keyDown(screen.getByText("custom"), { key: "k" });
    expect(element.play).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByText("custom"), { key: "x" });
    expect(element.play).toHaveBeenCalledTimes(1);
  });
});
