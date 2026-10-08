import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AudioPlayer, useIsLive } from "../../src/index";
import { createTestStore } from "./createTestStore";

function Badge() {
  return <span>{useIsLive() ? "live" : "not live"}</span>;
}

/**
 * B11. Firefox reports a live MP3 or Opus stream as a finite track whose
 * duration grows with the buffer, so `track.live` marks the element
 * `data-live` and the store reads it with the duration.
 */
describe("track.live", () => {
  it("is live whatever duration the element reports", () => {
    const { store, element } = createTestStore({
      duration: 12,
      readyState: 1,
    });
    element.dataset["live"] = "";

    element.emit("durationchange");
    expect(store.isLive.get()).toBe(true);
    expect(store.duration.get()).toBe(0);

    element.duration = 14;
    element.emit("durationchange");
    expect(store.isLive.get()).toBe(true);

    delete element.dataset["live"];
    element.emit("durationchange");
    expect(store.isLive.get()).toBe(false);
    expect(store.duration.get()).toBe(14);
  });

  it("is read on the reset a new source triggers", () => {
    const { store, element } = createTestStore({
      duration: 12,
      readyState: 1,
    });
    element.dataset["live"] = "";
    element.duration = NaN;

    element.emit("loadstart");

    expect(store.isLive.get()).toBe(true);
  });

  // The keys and `seek()` reach the write path from anywhere, so the guard is
  // there too. It reads the store's projection, which takes the mark at
  // `durationchange`, so the timeline and the keys cannot disagree.
  it.each([
    [{ type: "SET_TIME_FORWARD", value: 10 }],
    [{ type: "SET_TIME_BACKWARD", value: 10 }],
    [{ type: "SET_TIME_TO_START" }],
    [{ type: "SET_TIME_TO_PERCENT", percent: 0.5 }],
  ] as const)("ignores %o on a stream with a finite duration", (action) => {
    const { store, element } = createTestStore({
      duration: 12,
      currentTime: 4,
      readyState: 1,
    });
    element.dataset["live"] = "";
    element.emit("durationchange");

    store.send(action);

    expect(element.currentTime).toBe(4);
  });

  it.each([
    [{ src: "station.mp3", live: true }, "live"],
    [{ src: "episode.mp3" }, "not live"],
  ])("reaches useIsLive from AudioPlayer for %o", (track, expected) => {
    render(
      <AudioPlayer track={track}>
        <Badge />
      </AudioPlayer>,
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  // The mark leaves with the stream: `data-live` goes in the same commit as
  // the new `src`, so the `loadstart` that follows reads it gone. jsdom
  // loads nothing, so the test fires that event itself.
  it("clears on a swap from a live stream to a plain file", () => {
    const { container, rerender } = render(
      <AudioPlayer track={{ src: "station.mp3", live: true }}>
        <Badge />
      </AudioPlayer>,
    );
    expect(screen.getByText("live")).toBeInTheDocument();

    rerender(
      <AudioPlayer track={{ src: "episode.mp3" }}>
        <Badge />
      </AudioPlayer>,
    );
    fireEvent(container.querySelector("audio")!, new Event("loadstart"));

    expect(screen.getByText("not live")).toBeInTheDocument();
  });
});
