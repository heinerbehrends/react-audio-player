import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MediaSession } from "../../src/MediaSession/MediaSession";
import { PlayButton } from "../../src/Player/PlayButton";
import type { AudioFile } from "../../src/Player/PlayerConfigContext";
import { renderWithStore } from "../store/renderWithStore";
import { TestProviders } from "../testComponents";

// jsdom has no Media Session API. The fake holds the metadata; the constructor
// records its argument and, as Chrome does, rejects an artwork `src` that is not
// a URL.
const session = { metadata: null as unknown };
let constructed: MediaMetadataInit[] = [];

class FakeMediaMetadata {
  constructor(init: MediaMetadataInit) {
    for (const image of init.artwork ?? []) {
      if (!URL.canParse(image.src)) throw new TypeError("Invalid URL");
    }
    constructed.push(init);
    Object.assign(this, init);
  }
}

beforeEach(() => {
  session.metadata = null;
  constructed = [];
  Object.defineProperty(navigator, "mediaSession", {
    value: session,
    configurable: true,
  });
  vi.stubGlobal("MediaMetadata", FakeMediaMetadata);
});

afterEach(() => {
  // Before the fake goes: unmounting is what clears the session.
  cleanup();
  Reflect.deleteProperty(navigator, "mediaSession");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tagged: AudioFile = {
  src: "track.mp3",
  title: "The Race",
  artist: "Someone",
  album: "Something",
  artwork: [{ src: "https://example.com/cover.png", sizes: "512x512" }],
};

describe("MediaSession", () => {
  it("renders nothing", () => {
    const { container } = renderWithStore(<MediaSession />, {
      audioFile: tagged,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("sets the metadata from all four fields", () => {
    renderWithStore(<MediaSession />, { audioFile: tagged });

    expect(session.metadata).toBeInstanceOf(FakeMediaMetadata);
    expect(constructed).toEqual([
      {
        title: tagged.title,
        artist: tagged.artist,
        album: tagged.album,
        artwork: tagged.artwork,
      },
    ]);
  });

  it("sets no metadata for a bare src", () => {
    renderWithStore(<MediaSession />, { audioFile: { src: "track.mp3" } });

    expect(session.metadata).toBeNull();
    expect(constructed).toEqual([]);
  });

  it("rewrites the metadata when the title changes", () => {
    const { rerender } = render(
      <TestProviders audioFile={tagged}>
        <MediaSession />
      </TestProviders>,
    );

    rerender(
      <TestProviders audioFile={{ ...tagged, title: "The Next One" }}>
        <MediaSession />
      </TestProviders>,
    );

    expect(constructed.map((init) => init.title)).toEqual([
      tagged.title,
      "The Next One",
    ]);
  });

  it("does not rewrite the metadata when an equal literal re-renders", () => {
    const { rerender } = render(
      <TestProviders audioFile={{ ...tagged }}>
        <MediaSession />
      </TestProviders>,
    );

    rerender(
      <TestProviders audioFile={{ ...tagged, artwork: [...tagged.artwork!] }}>
        <MediaSession />
      </TestProviders>,
    );

    expect(constructed).toHaveLength(1);
  });

  it("clears the metadata on unmount", () => {
    const { unmount } = renderWithStore(<MediaSession />, {
      audioFile: tagged,
    });

    unmount();

    expect(session.metadata).toBeNull();
  });

  it("logs a rejected artwork URL and leaves the player rendering", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithStore(
      <>
        <MediaSession />
        <PlayButton>Play</PlayButton>
      </>,
      { audioFile: { ...tagged, artwork: [{ src: "http://[not a url" }] } },
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(session.metadata).toBeNull();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("<MediaSession>"),
      expect.any(TypeError),
    );
  });

  it("does nothing where the browser has no Media Session API", () => {
    Reflect.deleteProperty(navigator, "mediaSession");

    expect(() =>
      renderWithStore(<MediaSession />, { audioFile: tagged }).unmount(),
    ).not.toThrow();
    expect(constructed).toEqual([]);
  });

  /** The claim-on-play half lands with phase 4. */
  it("leaves the session to the instance that claimed it first", () => {
    renderWithStore(<MediaSession />, { audioFile: tagged });
    renderWithStore(<MediaSession />, {
      audioFile: { ...tagged, title: "Second" },
    });

    expect(constructed.map((init) => init.title)).toEqual([tagged.title]);
  });
});
