import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  useTextTrack,
  type TextTrackOptions,
} from "../../src/TextTrack/useTextTrack";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { createPlayerStore } from "../../src/store/createPlayerStore";
import { createTestStore } from "../store/createTestStore";
import { createMediaElementFake } from "../store/mediaElementFake";
import {
  createTextTrackFake,
  withTextTracks,
  type TextTrackFake,
  type TextTrackInit,
} from "../store/textTrackFake";

const CUES = [
  {
    id: "p1",
    start: 0,
    end: 4,
    text: "Alice was beginning to get very tired.",
  },
  { start: 4, end: 9, text: "Once or twice she had peeped into the book." },
];

const track = (init: Partial<TextTrackInit> = {}) =>
  createTextTrackFake({ cues: CUES, ...init });

/** Renders the hook against a store whose element holds `tracks`. */
function setup(tracks: TextTrackFake[], options?: TextTrackOptions) {
  const harness = createTestStore();
  const list = withTextTracks(harness.element, tracks);
  const result = renderHook(() => useTextTrack(options), {
    wrapper: ({ children }) => (
      <PlayerStoreProvider store={harness.store}>
        {children}
      </PlayerStoreProvider>
    ),
  });
  return { ...result, list };
}

describe("useTextTrack", () => {
  describe("choosing the track", () => {
    it("reads the one marked default", () => {
      const first = track({ language: "de" });
      const marked = track({ default: true });
      setup([first, marked]);

      expect(marked.track.mode).toBe("hidden");
      expect(first.track.mode).toBe("disabled");
    });

    it("reads the first of the kind without a default", () => {
      const first = track();
      const second = track();
      setup([first, second]);

      expect(first.track.mode).toBe("hidden");
      expect(second.track.mode).toBe("disabled");
    });

    it("prefers the language asked for", () => {
      const english = track({ default: true });
      const german = track({ language: "de" });
      setup([english, german], { language: "de" });

      expect(german.track.mode).toBe("hidden");
    });

    it("falls back to captions without subtitles", () => {
      const captions = track({ kind: "captions" });
      setup([track({ kind: "chapters" }), captions]);

      expect(captions.track.mode).toBe("hidden");
    });

    it("reads another kind when asked", () => {
      const chapters = track({ kind: "chapters" });
      setup([track(), chapters], { kind: "chapters" });

      expect(chapters.track.mode).toBe("hidden");
    });

    it("reports none without a matching track", () => {
      const { result } = setup([track({ kind: "chapters" })]);

      expect(result.current).toEqual({
        cues: [],
        activeIndex: -1,
        status: "none",
      });
    });

    // On `<audio>` "showing" and "hidden" look the same; the consumer chose.
    it("leaves a showing track showing", () => {
      const showing = track({ mode: "showing" });
      setup([showing]);

      expect(showing.track.mode).toBe("showing");
    });
  });

  describe("loading", () => {
    it("is loading until the file arrives, then ready with the cues", () => {
      const subtitles = track();
      const { result } = setup([subtitles]);
      expect(result.current.status).toBe("loading");
      expect(result.current.cues).toEqual([]);

      act(() => subtitles.load());

      expect(result.current.status).toBe("ready");
      expect(result.current.cues).toEqual([
        { id: "p1", start: 0, end: 4, text: CUES[0]!.text },
        { id: "", start: 4, end: 9, text: CUES[1]!.text },
      ]);
    });

    it("reports a file that fails", () => {
      const subtitles = track();
      const { result } = setup([subtitles]);

      act(() => subtitles.fail());

      expect(result.current.status).toBe("error");
    });

    // A track from `addTextTrack()` has no `<track>` element to report on.
    it("is ready at once on a scripted track", () => {
      const { result } = setup([track({ scripted: true })]);

      expect(result.current.status).toBe("ready");
      expect(result.current.cues).toHaveLength(2);
    });

    it("strips VTT markup and decodes its entities", () => {
      const subtitles = track({
        cues: [
          {
            start: 0,
            end: 1,
            text: "<v Alice><i>Curiouser</i> &amp; curiouser&lt;!&gt;</v>",
          },
        ],
      });
      const { result } = setup([subtitles]);

      act(() => subtitles.load());

      expect(result.current.cues[0]!.text).toBe("Curiouser & curiouser<!>");
    });

    // Safari's `DataCue` on a metadata track has no `getCueAsHTML`.
    it("reads a cue without text as empty", () => {
      const metadata = track({
        kind: "metadata",
        cues: [{ start: 0, end: 1 }],
      });
      const { result } = setup([metadata], { kind: "metadata" });

      act(() => metadata.load());

      expect(result.current.cues).toEqual([
        { id: "", start: 0, end: 1, text: "" },
      ]);
    });

    it("picks up a track added after it mounted", () => {
      const { result, list } = setup([]);
      expect(result.current.status).toBe("none");
      const late = track();

      act(() => list.add(late));
      act(() => late.load());

      expect(late.track.mode).toBe("hidden");
      expect(result.current.status).toBe("ready");
    });

    // A `<track>` React moves among its siblings leaves the list and returns.
    it("keeps the cues of a track that leaves the list and returns", () => {
      const subtitles = track();
      const { result, list } = setup([subtitles]);
      act(() => subtitles.load());

      act(() => list.remove(subtitles));
      expect(result.current.status).toBe("none");
      act(() => list.add(subtitles));

      expect(result.current.status).toBe("ready");
      expect(result.current.cues).toHaveLength(2);
    });

    // The browser fires nothing for the change itself, and may keep the old
    // cues and `LOADED` until the new file lands.
    it("is loading again, without cues, while a new src arrives", async () => {
      const subtitles = track();
      const { result } = setup([subtitles]);
      act(() => subtitles.load());
      expect(result.current.cues).toHaveLength(2);

      await act(async () => {
        subtitles.element!.src = "next-episode.vtt";
      });
      expect(result.current.status).toBe("loading");
      expect(result.current.cues).toEqual([]);

      act(() => subtitles.load());

      expect(result.current.status).toBe("ready");
      expect(result.current.cues).toHaveLength(2);
    });

    it("picks up an element that attaches after it mounted", () => {
      const store = createPlayerStore();
      const subtitles = track();
      const { result } = renderHook(() => useTextTrack(), {
        wrapper: ({ children }) => (
          <PlayerStoreProvider store={store}>{children}</PlayerStoreProvider>
        ),
      });
      expect(result.current.status).toBe("none");

      const element = createMediaElementFake();
      withTextTracks(element, [subtitles]);
      act(() => {
        store.attach(element as unknown as HTMLAudioElement);
      });
      act(() => subtitles.load());

      expect(result.current.status).toBe("ready");
    });
  });

  describe("the active cue", () => {
    it("follows cuechange, and is -1 between cues", () => {
      const subtitles = track();
      const { result } = setup([subtitles]);
      act(() => subtitles.load());
      expect(result.current.activeIndex).toBe(-1);

      act(() => subtitles.play(1));
      expect(result.current.activeIndex).toBe(1);

      act(() => subtitles.play(-1));
      expect(result.current.activeIndex).toBe(-1);
    });

    // Chromium keeps a cue active at its exact end, next to the one after it.
    it("marks the cue that began last when two are active", () => {
      const subtitles = track();
      const { result } = setup([subtitles]);
      act(() => subtitles.load());

      act(() => subtitles.play(0, 1));

      expect(result.current.activeIndex).toBe(1);
    });

    it("keeps the snapshot, cues included, when nothing changed", () => {
      const subtitles = track();
      const { result } = setup([subtitles]);
      act(() => subtitles.load());
      act(() => subtitles.play(0));
      const before = result.current;

      act(() => subtitles.play(0));
      expect(result.current).toBe(before);

      act(() => subtitles.play(1));
      expect(result.current.cues).toBe(before.cues);
    });
  });

  it("removes every listener on unmount", () => {
    const subtitles = track();
    const { unmount, list } = setup([subtitles]);

    unmount();

    expect(list.listenerCount("addtrack")).toBe(0);
    expect(list.listenerCount("removetrack")).toBe(0);
    expect(list.listenerCount("change")).toBe(0);
    expect(subtitles.track.listenerCount("cuechange")).toBe(0);
    expect(subtitles.element!.listenerCount("load")).toBe(0);
    expect(subtitles.element!.listenerCount("error")).toBe(0);
  });

  // The first client render sees the same, so hydration cannot mismatch.
  it("renders the empty state on the server", () => {
    let seen: unknown;
    function Probe() {
      seen = useTextTrack();
      return null;
    }

    renderToString(
      <PlayerStoreProvider store={createPlayerStore()}>
        <Probe />
      </PlayerStoreProvider>,
    );

    expect(seen).toEqual({ cues: [], activeIndex: -1, status: "none" });
  });
});
