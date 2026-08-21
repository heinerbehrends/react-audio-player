import { describe, it, expect, vi } from "vitest";
import { createPlayerStore } from "../../src/store/createPlayerStore";
import { createMediaElementFake } from "./mediaElementFake";

describe("createPlayerStore", () => {
  it("starts with the documented initial projection", () => {
    const store = createPlayerStore();

    expect(store.currentTime.get()).toBe(0);
    expect(store.currentSecond.get()).toBe(0);
    expect(store.duration.get()).toBe(0);
    expect(store.volume.get()).toBe(1);
    expect(store.muted.get()).toBe(false);
    expect(store.lastAudibleVolume.get()).toBe(1);
    expect(store.rate.get()).toBe(1);
    expect(store.paused.get()).toBe(true);
    expect(store.loadState.get()).toBe("loading");
    expect(store.timeDisplay.get()).toBe("elapsed");
  });

  it("hands out projections with no set handle", () => {
    const store = createPlayerStore();

    expect("set" in store.currentTime).toBe(false);
    expect("set" in store.loadState).toBe(false);
    expect("set" in store.volume).toBe(false);
  });

  it("makes timeDisplay writable, the one UI atom", () => {
    const store = createPlayerStore();

    store.timeDisplay.set("remaining");

    expect(store.timeDisplay.get()).toBe("remaining");
  });

  describe("attach", () => {
    it("primes the projection off the element", () => {
      const store = createPlayerStore();

      store.attach(
        createMediaElementFake({
          currentTime: 30,
          duration: 200,
          volume: 0.5,
          playbackRate: 2,
          paused: false,
          readyState: 1,
        }),
      );

      expect(store.currentTime.get()).toBe(30);
      expect(store.duration.get()).toBe(200);
      expect(store.volume.get()).toBe(0.5);
      expect(store.lastAudibleVolume.get()).toBe(0.5);
      expect(store.rate.get()).toBe(2);
      expect(store.paused.get()).toBe(false);
      expect(store.loadState.get()).toBe("ready");
    });

    it("catches an error that fired before the effect ran", () => {
      const store = createPlayerStore();

      store.attach(createMediaElementFake({ error: {} as MediaError }));

      expect(store.loadState.get()).toBe("error");
    });

    it("projects events onto the atoms", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake();
      store.attach(element);

      element.currentTime = 15.5;
      element.emit("timeupdate");

      expect(store.currentTime.get()).toBe(15.5);
      expect(store.currentSecond.get()).toBe(15);
    });

    it("is idempotent across a StrictMode style remount", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake({ readyState: 1, duration: 120 });

      const detachFirst = store.attach(element);
      detachFirst();
      store.attach(element);

      // One listener per event, so a single timeupdate is projected once.
      let notifications = 0;
      store.currentTime.subscribe(() => (notifications += 1));
      element.currentTime = 5;
      element.emit("timeupdate");

      expect(notifications).toBe(1);
      expect(store.duration.get()).toBe(120);
    });

    it("recovers an event lost in the detach to attach gap by priming", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake({ readyState: 0 });
      const detach = store.attach(element);

      detach();
      // loadedmetadata lands while nothing is listening.
      element.readyState = 1;
      element.duration = 90;
      store.attach(element);

      expect(store.loadState.get()).toBe("ready");
      expect(store.duration.get()).toBe(90);
    });

    it("re-primes when the element is swapped", () => {
      const store = createPlayerStore();
      const detach = store.attach(
        createMediaElementFake({ volume: 0.25, readyState: 1 }),
      );

      detach();
      store.attach(createMediaElementFake({ volume: 0.75, readyState: 0 }));

      expect(store.volume.get()).toBe(0.75);
      expect(store.loadState.get()).toBe("loading");
    });
  });

  describe("send", () => {
    it("does nothing before an element is attached", () => {
      const store = createPlayerStore();

      expect(() => store.send({ type: "PLAY" })).not.toThrow();
    });

    it("reaches the attached element", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake();
      store.attach(element);

      store.send({ type: "PLAY" });

      expect(element.play).toHaveBeenCalled();
    });

    it("writes the element rather than the atoms", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake({ currentTime: 50 });
      store.attach(element);

      store.send({ type: "SET_TIME_TO_START" });

      expect(element.currentTime).toBe(0);
      // No media event was dispatched, so the projection has not moved yet.
      expect(store.currentTime.get()).toBe(50);
    });

    it("stops reaching a detached element", () => {
      const store = createPlayerStore();
      const element = createMediaElementFake();
      const detach = store.attach(element);

      detach();
      store.send({ type: "PLAY" });

      expect(element.play).not.toHaveBeenCalled();
    });

    it("keeps sending to the current element after a swap", () => {
      const store = createPlayerStore();
      const first = createMediaElementFake();
      const second = createMediaElementFake();

      store.attach(first)();
      store.attach(second);
      store.send({ type: "PLAY" });

      expect(first.play).not.toHaveBeenCalled();
      expect(second.play).toHaveBeenCalled();
    });
  });

  describe("per instance scoping", () => {
    it("keeps two stores independent", () => {
      const first = createPlayerStore();
      const second = createPlayerStore();
      const firstElement = createMediaElementFake();
      const secondElement = createMediaElementFake();
      first.attach(firstElement);
      second.attach(secondElement);

      firstElement.currentTime = 20;
      firstElement.emit("timeupdate");

      expect(first.currentTime.get()).toBe(20);
      expect(second.currentTime.get()).toBe(0);
    });

    it("does not share subscribers", () => {
      const first = createPlayerStore();
      const second = createPlayerStore();
      const listener = vi.fn();
      second.paused.subscribe(listener);
      const element = createMediaElementFake({ paused: true });
      first.attach(element);

      element.paused = false;
      element.emit("play");

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
