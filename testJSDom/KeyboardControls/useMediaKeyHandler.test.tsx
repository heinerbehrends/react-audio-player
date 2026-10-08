import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMediaKeyHandler } from "../../src/KeyboardControls/handleMediaKeys";
import {
  PlayerRoot,
  Timeline,
  usePlayButtonProps,
  usePlayerRootProps,
} from "../../src/index";
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

  it("follows shortcuts", () => {
    const { element } = renderWithStore(<Player />, {
      ...loaded,
      shortcuts: { k: null, x: { type: "TOGGLE_PLAY" } },
    });

    fireEvent.keyDown(screen.getByText("custom"), { key: "k" });
    expect(element.play).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByText("custom"), { key: "x" });
    expect(element.play).toHaveBeenCalledTimes(1);
  });
});

function Root(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <PlayerRoot {...props}>
      <button>custom</button>
      <LibraryButton />
    </PlayerRoot>
  );
}

/**
 * The container the library does not render (A10): a named landmark that a
 * click focuses, so the shortcuts work from anywhere inside it.
 */
describe("<PlayerRoot>", () => {
  it("is a named region that clicks focus and Tab skips", () => {
    renderWithStore(<Root />, loaded);

    const root = screen.getByRole("region", { name: "audio player" });
    expect(root).toHaveAttribute("tabindex", "-1");
    expect(root).toHaveAttribute("data-part", "player");
  });

  // The hook is what the component is made of, for an element of your own.
  it("is the same through usePlayerRootProps on a <section>", () => {
    function Section() {
      return (
        <section {...usePlayerRootProps({ className: "player" })}>
          <button>custom</button>
        </section>
      );
    }
    const { element } = renderWithStore(<Section />, loaded);

    const root = screen.getByRole("region", { name: "audio player" });
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveClass("player");
    fireEvent.keyDown(screen.getByText("custom"), { key: "k" });
    expect(element.play).toHaveBeenCalledTimes(1);
  });

  // `labels` is shared by every player on a page; the title tells them apart.
  it("takes its name from the track title, over labels.player", () => {
    renderWithStore(<Root />, {
      ...loaded,
      track: { src: "race.mp3", title: "The Race" },
      labels: { player: "Hörbuch" },
    });

    expect(
      screen.getByRole("region", { name: "The Race" }),
    ).toBeInTheDocument();
  });

  it("takes its name from labels.player without a title", () => {
    renderWithStore(<Root />, { ...loaded, labels: { player: "Hörbuch" } });

    expect(screen.getByRole("region", { name: "Hörbuch" })).toBeInTheDocument();
  });

  it("passes the caller's props through", () => {
    renderWithStore(
      <>
        <h2 id="title">Down the Rabbit-Hole</h2>
        <Root className="player" aria-labelledby="title" />
      </>,
      loaded,
    );

    const root = screen.getByRole("region", { name: "Down the Rabbit-Hole" });
    expect(root).toHaveClass("player");
  });

  it("runs the shortcuts from inside, and from the root itself", () => {
    const { element } = renderWithStore(<Root />, loaded);

    fireEvent.keyDown(screen.getByText("custom"), { key: "k" });
    expect(element.play).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByRole("region"), { key: "m" });
    expect(element.muted).toBe(true);
  });

  // The slider swallows the key; the root is the first listener above it.
  it("ignores arrow keys on a disabled slider inside", () => {
    const { element } = renderWithStore(
      <PlayerRoot>
        <Timeline>
          <Timeline.Control />
        </Timeline>
      </PlayerRoot>,
      { element: { readyState: 0, duration: NaN, volume: 0.5 } },
    );
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-disabled", "true");

    fireEvent.keyDown(slider, { key: "ArrowUp" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(element.volume).toBe(0.5);
    expect(element.currentTime).toBe(0);
  });

  it("runs the caller's onKeyDown first, and preventDefault opts out", () => {
    const { element } = renderWithStore(
      <Root
        onKeyDown={(event) => {
          if (event.key === "k") event.preventDefault();
        }}
      />,
      loaded,
    );

    fireEvent.keyDown(screen.getByText("custom"), { key: "k" });
    expect(element.play).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByText("custom"), { key: "m" });
    expect(element.muted).toBe(true);
  });

  describe("Space", () => {
    it("plays and pauses with the container itself focused", () => {
      const { element } = renderWithStore(<Root />, loaded);

      const notPrevented = fireEvent.keyDown(screen.getByRole("region"), {
        key: " ",
      });

      expect(element.play).toHaveBeenCalledTimes(1);
      // The page would otherwise scroll.
      expect(notPrevented).toBe(false);
    });

    // A1: on a button, Space is how the button gets pressed.
    it.each(["custom", "library"])(
      "is left to the %s button it is pressed on",
      (name) => {
        const { element } = renderWithStore(<Root />, loaded);

        const notPrevented = fireEvent.keyDown(screen.getByText(name), {
          key: " ",
        });

        expect(element.play).not.toHaveBeenCalled();
        expect(notPrevented).toBe(true);
      },
    );

    it("gives way to a binding of the caller's", () => {
      const { element } = renderWithStore(<Root />, {
        ...loaded,
        shortcuts: { " ": { type: "TOGGLE_MUTE" } },
      });

      fireEvent.keyDown(screen.getByRole("region"), { key: " " });

      expect(element.play).not.toHaveBeenCalled();
      expect(element.muted).toBe(true);
    });

    it("stays off when the caller unbinds it", () => {
      const { element } = renderWithStore(<Root />, {
        ...loaded,
        shortcuts: { " ": null },
      });

      const notPrevented = fireEvent.keyDown(screen.getByRole("region"), {
        key: " ",
      });

      expect(element.play).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it("leaves modifier combinations to the browser", () => {
      const { element } = renderWithStore(<Root />, loaded);

      fireEvent.keyDown(screen.getByRole("region"), {
        key: " ",
        ctrlKey: true,
      });

      expect(element.play).not.toHaveBeenCalled();
    });
  });
});
