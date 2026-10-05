import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MediaSession } from "../../src/MediaSession/MediaSession";
import { PlayButton } from "../../src/Player/PlayButton";
import type { AudioFile } from "../../src/Player/PlayerConfigContext";
import { renderWithStore } from "../store/renderWithStore";
import { TestProviders } from "../testComponents";

// jsdom has no Media Session API. The fake holds the metadata, the playback
// state and the registered handlers by name, and records position writes; the constructor records its argument and, as
// Chrome does, rejects an artwork `src` that is not a URL.
const handlers = new Map<MediaSessionAction, MediaSessionActionHandler>();
let unsupported: MediaSessionAction[] = [];
const session = {
  metadata: null as unknown,
  playbackState: "none" as MediaSessionPlaybackState,
  setPositionState: undefined as
    Mock<(state?: MediaPositionState) => void> | undefined,
  setActionHandler(
    action: MediaSessionAction,
    handler: MediaSessionActionHandler | null,
  ) {
    if (unsupported.includes(action)) throw new TypeError(`No ${action}`);
    if (handler) handlers.set(action, handler);
    else handlers.delete(action);
  },
};
let constructed: MediaMetadataInit[] = [];

/** Presses a system button, as the OS would. */
function press(
  action: MediaSessionAction,
  details: Partial<MediaSessionActionDetails> = {},
) {
  const handler = handlers.get(action);
  if (!handler) throw new Error(`No handler for ${action}`);
  act(() => handler({ action, ...details }));
}

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
  session.playbackState = "none";
  session.setPositionState = vi.fn();
  handlers.clear();
  unsupported = [];
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

describe("MediaSession action handlers", () => {
  it("registers play, pause and the seeks, and neither track skip nor stop", () => {
    renderWithStore(<MediaSession />);

    expect([...handlers.keys()].sort()).toEqual(
      ["pause", "play", "seekbackward", "seekforward", "seekto"].sort(),
    );
  });

  it("plays and pauses the element, each on its own", () => {
    const { element } = renderWithStore(<MediaSession />);

    press("play");
    expect(element.play).toHaveBeenCalledTimes(1);
    expect(element.pause).not.toHaveBeenCalled();

    press("pause");
    expect(element.pause).toHaveBeenCalledTimes(1);
    expect(element.play).toHaveBeenCalledTimes(1);
  });

  it("skips by 10 seconds by default", () => {
    const { element } = renderWithStore(<MediaSession />, {
      element: { currentTime: 30 },
    });

    press("seekforward");
    expect(element.currentTime).toBe(40);
    press("seekbackward");
    expect(element.currentTime).toBe(30);
  });

  it("skips by the seekOffset prop", () => {
    const { element } = renderWithStore(<MediaSession seekOffset={15} />, {
      element: { currentTime: 30 },
    });

    press("seekforward");
    expect(element.currentTime).toBe(45);
  });

  it("skips by the system's own offset when it names one", () => {
    const { element } = renderWithStore(<MediaSession seekOffset={15} />, {
      element: { currentTime: 30 },
    });

    press("seekbackward", { seekOffset: 5 });
    expect(element.currentTime).toBe(25);
  });

  it("seeks to the system's position", () => {
    const { element } = renderWithStore(<MediaSession />);

    press("seekto", { seekTime: 42 });
    expect(element.currentTime).toBe(42);
  });

  it("ignores the skips and seekto without a duration", () => {
    const { element } = renderWithStore(<MediaSession />, {
      element: { duration: NaN, currentTime: 5 },
    });

    press("seekforward");
    press("seekbackward");
    press("seekto", { seekTime: 42 });
    expect(element.currentTime).toBe(5);
  });

  it("registers previous and next only when their handlers are passed", () => {
    const onPreviousTrack = vi.fn();
    const onNextTrack = vi.fn();
    renderWithStore(
      <MediaSession
        onPreviousTrack={onPreviousTrack}
        onNextTrack={onNextTrack}
      />,
    );

    press("previoustrack");
    press("nexttrack");
    expect(onPreviousTrack).toHaveBeenCalledTimes(1);
    expect(onNextTrack).toHaveBeenCalledTimes(1);
  });

  it("calls the latest inline handler and drops the button when it goes", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderWithStore(<MediaSession onNextTrack={first} />);

    rerender(<MediaSession onNextTrack={second} />);
    press("nexttrack");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    rerender(<MediaSession />);
    expect(handlers.has("nexttrack")).toBe(false);
  });

  it("removes every handler on unmount", () => {
    const { unmount } = renderWithStore(<MediaSession onNextTrack={vi.fn()} />);

    unmount();

    expect(handlers.size).toBe(0);
  });

  it("registers the rest when the browser rejects an action", () => {
    unsupported = ["seekto"];

    renderWithStore(<MediaSession />);

    expect(handlers.has("play")).toBe(true);
    expect(handlers.has("seekforward")).toBe(true);
    expect(handlers.has("seekto")).toBe(false);
  });
});

describe("MediaSession position and playback state", () => {
  /** The position writes since the last call, ignoring the clearing ones. */
  function positions() {
    return session
      .setPositionState!.mock.calls.map(([state]) => state)
      .filter((state) => state !== undefined);
  }

  it("writes the position on mount", () => {
    renderWithStore(<MediaSession />, { element: { currentTime: 12.5 } });

    expect(positions()).toEqual([
      { duration: 100, playbackRate: 1, position: 12.5 },
    ]);
  });

  it("writes once per second crossed, not per timeupdate", () => {
    const { element, emit } = renderWithStore(<MediaSession />);
    session.setPositionState!.mockClear();

    element.currentTime = 0.25;
    emit("timeupdate");
    element.currentTime = 0.5;
    emit("timeupdate");
    expect(positions()).toEqual([]);

    element.currentTime = 1.25;
    emit("timeupdate");
    expect(positions()).toEqual([
      { duration: 100, playbackRate: 1, position: 1.25 },
    ]);
  });

  it("writes the new rate", () => {
    const { element, emit } = renderWithStore(<MediaSession />);
    session.setPositionState!.mockClear();

    element.playbackRate = 1.5;
    emit("ratechange");

    expect(positions()).toEqual([
      { duration: 100, playbackRate: 1.5, position: 0 },
    ]);
  });

  it("clears the position for a live stream and writes no more", () => {
    const { element, emit } = renderWithStore(<MediaSession />);
    session.setPositionState!.mockClear();

    element.duration = Infinity;
    emit("durationchange");
    element.currentTime = 5;
    emit("timeupdate");

    expect(session.setPositionState!.mock.calls).toEqual([[]]);
  });

  it("clamps the position to the duration after ended", () => {
    const { element, emit } = renderWithStore(<MediaSession />);
    session.setPositionState!.mockClear();

    // Chrome parks `currentTime` past `duration` here.
    element.currentTime = 100.5;
    element.paused = true;
    emit("ended");

    expect(positions().at(-1)).toEqual({
      duration: 100,
      playbackRate: 1,
      position: 100,
    });
  });

  it("logs a rejected position and keeps the player running", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // A write rejected, as Chrome does for inputs it finds invalid. Clearing,
    // with no argument, never throws.
    session.setPositionState!.mockImplementation((state) => {
      if (state) throw new TypeError("Invalid position");
    });

    renderWithStore(
      <>
        <MediaSession />
        <PlayButton>Play</PlayButton>
      </>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("the position state"),
      expect.any(TypeError),
    );
  });

  it("sets the playback state from play and pause", () => {
    const { element, emit } = renderWithStore(<MediaSession />);
    expect(session.playbackState).toBe("paused");

    element.paused = false;
    emit("play");
    expect(session.playbackState).toBe("playing");

    element.paused = true;
    emit("pause");
    expect(session.playbackState).toBe("paused");
  });

  it("resets the playback state and the position on unmount", () => {
    const { unmount } = renderWithStore(<MediaSession />);
    session.setPositionState!.mockClear();

    unmount();

    expect(session.playbackState).toBe("none");
    expect(session.setPositionState!.mock.calls).toEqual([[]]);
  });

  it("still sets the playback state without setPositionState", () => {
    session.setPositionState = undefined;

    const { element, emit } = renderWithStore(<MediaSession />);
    element.paused = false;
    emit("play");

    expect(session.playbackState).toBe("playing");
  });
});
