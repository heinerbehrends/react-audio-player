import { describe, it, expect } from "vitest";
import { atom } from "../../src/store/atom";
import {
  HANDLERS,
  prime,
  syncFromElement,
  type LoadState,
  type ProjectionAtoms,
  type SyncEvent,
} from "../../src/store/syncFromElement";
import { createMediaElementFake } from "./mediaElementFake";

function createAtoms(): ProjectionAtoms {
  return {
    currentTime: atom(0),
    currentSecond: atom(0),
    duration: atom(0),
    volume: atom(1),
    muted: atom(false),
    lastAudibleVolume: atom(1),
    rate: atom(1),
    paused: atom(true),
    readyState: atom(0),
    mediaErrorCode: atom<number | null>(null),
    loadState: atom<LoadState>("loading"),
  };
}

/**
 * One row per media event the sync layer handles. Typed as `SyncEvent[]`, so a
 * typo here is a build error rather than a name that agrees with a typo in
 * `HANDLERS` and slips past the completeness check below.
 */
const DOCUMENTED_EVENTS: SyncEvent[] = [
  "timeupdate",
  "seeked",
  "loadedmetadata",
  "durationchange",
  "volumechange",
  "ratechange",
  "play",
  "pause",
  "ended",
  "error",
  "emptied",
  "loadstart",
  "waiting",
  "stalled",
  "playing",
  "canplay",
  "canplaythrough",
  "progress",
];

describe("HANDLERS", () => {
  it("has exactly one row per documented event", () => {
    expect(Object.keys(HANDLERS).sort()).toEqual([...DOCUMENTED_EVENTS].sort());
  });
});

describe("readyState projection", () => {
  const STALL_EVENTS: SyncEvent[] = [
    "waiting",
    "stalled",
    "playing",
    "canplay",
    "canplaythrough",
    "progress",
  ];

  it.each(STALL_EVENTS)("projects the rung off the element on %s", (event) => {
    const atoms = createAtoms();
    const element = createMediaElementFake({ readyState: 4 });

    HANDLERS[event](element, atoms, false);

    expect(atoms.readyState.get()).toBe(4);
  });

  it("follows the rung down as well as up", () => {
    const atoms = createAtoms();
    const element = createMediaElementFake({ readyState: 4 });

    HANDLERS.canplaythrough(element, atoms, false);
    expect(atoms.readyState.get()).toBe(4);

    element.readyState = 1;
    HANDLERS.waiting(element, atoms, false);
    expect(atoms.readyState.get()).toBe(1);
  });

  /**
   * `progress` fires every few hundred milliseconds while downloading, so the
   * bail-out is what keeps a download from waking every subscriber. Without it
   * this is the noisiest atom in the store.
   */
  it("does not wake subscribers when the rung has not moved", () => {
    const atoms = createAtoms();
    const element = createMediaElementFake({ readyState: 4 });
    let wakes = 0;
    atoms.readyState.subscribe(() => (wakes += 1));

    HANDLERS.progress(element, atoms, false);
    HANDLERS.progress(element, atoms, false);
    HANDLERS.progress(element, atoms, false);

    expect(wakes).toBe(1);
  });

  it("is primed off the element, alongside loadState", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ readyState: 2 }), atoms);

    expect(atoms.readyState.get()).toBe(2);
    expect(atoms.loadState.get()).toBe("ready");
  });
});

describe("syncFromElement", () => {
  it("subscribes to every documented event", () => {
    const element = createMediaElementFake();
    syncFromElement(element, createAtoms());

    DOCUMENTED_EVENTS.forEach((event) => {
      expect(element.listenerCount(event), event).toBe(1);
    });
  });

  it("removes every listener on detach", () => {
    const element = createMediaElementFake();
    const detach = syncFromElement(element, createAtoms());

    detach();

    DOCUMENTED_EVENTS.forEach((event) => {
      expect(element.listenerCount(event), event).toBe(0);
    });
  });

  it("stops writing atoms after detach", () => {
    const element = createMediaElementFake({ currentTime: 0 });
    const atoms = createAtoms();
    const detach = syncFromElement(element, atoms);

    detach();
    element.currentTime = 42;
    element.emit("timeupdate");

    expect(atoms.currentTime.get()).toBe(0);
  });

  it("leaves no listeners behind across attach, detach, attach", () => {
    const element = createMediaElementFake();
    const atoms = createAtoms();

    syncFromElement(element, atoms)();
    syncFromElement(element, atoms);

    DOCUMENTED_EVENTS.forEach((event) => {
      expect(element.listenerCount(event), event).toBe(1);
    });
  });

  describe("timeupdate", () => {
    it("writes currentTime and the floored currentSecond", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.currentTime = 12.75;
      element.emit("timeupdate");

      expect(atoms.currentTime.get()).toBe(12.75);
      expect(atoms.currentSecond.get()).toBe(12);
    });

    it("does not notify currentSecond while the second is unchanged", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);
      element.currentTime = 12.25;
      element.emit("timeupdate");

      let secondNotifications = 0;
      let timeNotifications = 0;
      atoms.currentSecond.subscribe(() => (secondNotifications += 1));
      atoms.currentTime.subscribe(() => (timeNotifications += 1));

      element.currentTime = 12.5;
      element.emit("timeupdate");
      element.currentTime = 12.75;
      element.emit("timeupdate");

      expect(timeNotifications).toBe(2);
      expect(secondNotifications).toBe(0);
    });
  });

  describe("seeked", () => {
    it("writes currentTime and currentSecond, like timeupdate", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.currentTime = 30.5;
      element.emit("seeked");

      expect(atoms.currentTime.get()).toBe(30.5);
      expect(atoms.currentSecond.get()).toBe(30);
    });
  });

  describe("loadedmetadata", () => {
    it("writes duration and moves loadState to ready", () => {
      const element = createMediaElementFake({ duration: Number.NaN });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.duration = 240;
      element.emit("loadedmetadata");

      expect(atoms.duration.get()).toBe(240);
      expect(atoms.loadState.get()).toBe("ready");
    });

    it("normalises a non-finite duration to 0", () => {
      const element = createMediaElementFake({
        duration: Number.POSITIVE_INFINITY,
      });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.emit("loadedmetadata");

      expect(atoms.duration.get()).toBe(0);
      expect(atoms.loadState.get()).toBe("ready");
    });
  });

  describe("durationchange", () => {
    it("writes duration and leaves loadState alone", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.duration = 180;
      element.emit("durationchange");

      expect(atoms.duration.get()).toBe(180);
      expect(atoms.loadState.get()).toBe("loading");
    });

    it("normalises NaN to 0", () => {
      const element = createMediaElementFake({ duration: 100 });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.duration = Number.NaN;
      element.emit("durationchange");

      expect(atoms.duration.get()).toBe(0);
    });
  });

  describe("volumechange", () => {
    it("writes volume and muted", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.volume = 0.4;
      element.muted = true;
      element.emit("volumechange");

      expect(atoms.volume.get()).toBe(0.4);
      expect(atoms.muted.get()).toBe(true);
    });

    it("remembers an audible volume", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.volume = 0.6;
      element.emit("volumechange");

      expect(atoms.lastAudibleVolume.get()).toBe(0.6);
    });

    it("remembers a volume that is audible but tiny", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.volume = 0.0005;
      element.emit("volumechange");

      expect(atoms.lastAudibleVolume.get()).toBe(0.0005);
    });

    it("does not remember a volume of zero", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);
      element.volume = 0.6;
      element.emit("volumechange");

      element.volume = 0;
      element.emit("volumechange");

      expect(atoms.volume.get()).toBe(0);
      expect(atoms.lastAudibleVolume.get()).toBe(0.6);
    });

    it("does not remember the volume while muted", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);
      element.volume = 0.6;
      element.emit("volumechange");

      element.muted = true;
      element.volume = 0.2;
      element.emit("volumechange");

      expect(atoms.lastAudibleVolume.get()).toBe(0.6);
    });
  });

  describe("ratechange", () => {
    it("writes rate", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.playbackRate = 1.5;
      element.emit("ratechange");

      expect(atoms.rate.get()).toBe(1.5);
    });
  });

  describe("play, pause and ended", () => {
    it("projects paused off the element on play", () => {
      const element = createMediaElementFake({ paused: true });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.paused = false;
      element.emit("play");

      expect(atoms.paused.get()).toBe(false);
    });

    it("projects paused off the element on pause", () => {
      const element = createMediaElementFake({ paused: false });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.paused = true;
      element.emit("pause");

      expect(atoms.paused.get()).toBe(true);
    });

    it("projects paused off the element on ended", () => {
      const element = createMediaElementFake({ paused: false });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.paused = true;
      element.emit("ended");

      expect(atoms.paused.get()).toBe(true);
    });

    it("does not toggle, so a duplicated event cannot invert the UI", () => {
      const element = createMediaElementFake({ paused: true });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.paused = false;
      element.emit("play");
      element.emit("play");

      expect(atoms.paused.get()).toBe(false);
    });

    it("leaves the time where the element left it on ended", () => {
      const element = createMediaElementFake({
        duration: 100,
        currentTime: 100,
      });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.emit("ended");

      expect(atoms.currentTime.get()).toBe(100);
    });
  });

  describe("error", () => {
    it("moves loadState to error", () => {
      const element = createMediaElementFake();
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.emit("error");

      expect(atoms.loadState.get()).toBe("error");
    });
  });

  describe("emptied and loadstart", () => {
    it("re-primes the whole projection on emptied", () => {
      const element = createMediaElementFake({ readyState: 1, duration: 100 });
      const atoms = createAtoms();
      syncFromElement(element, atoms);
      element.emit("loadedmetadata");

      // What a src swap does: the media load algorithm pauses the element and
      // resets the rate without firing pause or, reliably, ratechange.
      element.readyState = 0;
      element.duration = Number.NaN;
      element.currentTime = 0;
      element.paused = true;
      element.playbackRate = 1;
      element.emit("emptied");

      expect(atoms.duration.get()).toBe(0);
      expect(atoms.paused.get()).toBe(true);
      expect(atoms.rate.get()).toBe(1);
      expect(atoms.loadState.get()).toBe("loading");
    });

    it("re-primes on loadstart", () => {
      const element = createMediaElementFake({ readyState: 1 });
      const atoms = createAtoms();
      syncFromElement(element, atoms);
      element.emit("error");

      element.readyState = 0;
      element.error = null;
      element.emit("loadstart");

      expect(atoms.loadState.get()).toBe("loading");
    });
  });

  describe("loadState", () => {
    it("walks ready to error to loading to ready", () => {
      const element = createMediaElementFake({ readyState: 1 });
      const atoms = createAtoms();
      syncFromElement(element, atoms);

      element.emit("loadedmetadata");
      expect(atoms.loadState.get()).toBe("ready");

      element.error = {} as MediaError;
      element.emit("error");
      expect(atoms.loadState.get()).toBe("error");

      element.error = null;
      element.readyState = 0;
      element.emit("emptied");
      element.emit("loadstart");
      expect(atoms.loadState.get()).toBe("loading");

      element.readyState = 1;
      element.emit("loadedmetadata");
      expect(atoms.loadState.get()).toBe("ready");
    });
  });
});

describe("prime", () => {
  it("reads the whole projection off the element", () => {
    const element = createMediaElementFake({
      currentTime: 42.6,
      duration: 300,
      volume: 0.3,
      muted: true,
      playbackRate: 1.25,
      paused: false,
      readyState: 4,
    });
    const atoms = createAtoms();

    prime(element, atoms);

    expect(atoms.currentTime.get()).toBe(42.6);
    expect(atoms.currentSecond.get()).toBe(42);
    expect(atoms.duration.get()).toBe(300);
    expect(atoms.volume.get()).toBe(0.3);
    expect(atoms.muted.get()).toBe(true);
    expect(atoms.rate.get()).toBe(1.25);
    expect(atoms.paused.get()).toBe(false);
    expect(atoms.loadState.get()).toBe("ready");
  });

  it("lands ready when metadata already arrived", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ readyState: 1 }), atoms);

    expect(atoms.loadState.get()).toBe("ready");
  });

  it("lands error when the element already failed, not loading", () => {
    const atoms = createAtoms();

    prime(
      createMediaElementFake({ readyState: 0, error: {} as MediaError }),
      atoms,
    );

    expect(atoms.loadState.get()).toBe("error");
  });

  it("prefers error over readyState", () => {
    const atoms = createAtoms();

    prime(
      createMediaElementFake({ readyState: 4, error: {} as MediaError }),
      atoms,
    );

    expect(atoms.loadState.get()).toBe("error");
  });

  it("lands loading before metadata", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ readyState: 0 }), atoms);

    expect(atoms.loadState.get()).toBe("loading");
  });

  it("normalises a non-finite duration", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ duration: Number.NaN }), atoms);

    expect(atoms.duration.get()).toBe(0);
  });

  it("leaves paused true after a src swap while playing", () => {
    const element = createMediaElementFake({ paused: false, readyState: 1 });
    const atoms = createAtoms();
    prime(element, atoms);
    expect(atoms.paused.get()).toBe(false);

    // The load algorithm pauses the element without firing `pause`.
    element.paused = true;
    element.readyState = 0;
    prime(element, atoms);

    expect(atoms.paused.get()).toBe(true);
  });

  it("seeds lastAudibleVolume from an audible element", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ volume: 0.3 }), atoms);

    expect(atoms.lastAudibleVolume.get()).toBe(0.3);
  });

  it("keeps the remembered volume when the element is silent", () => {
    const element = createMediaElementFake({ volume: 0.2 });
    const atoms = createAtoms();
    syncFromElement(element, atoms);
    element.volume = 0.8;
    element.emit("volumechange");

    element.volume = 0;
    prime(element, atoms);

    expect(atoms.volume.get()).toBe(0);
    expect(atoms.lastAudibleVolume.get()).toBe(0.8);
  });

  it("keeps the remembered volume when the element is muted", () => {
    const atoms = createAtoms();

    prime(createMediaElementFake({ volume: 0.6, muted: true }), atoms);

    expect(atoms.lastAudibleVolume.get()).toBe(1);
  });

  it("defends the click-to-zero dead-end when volumechange was lost", () => {
    // The element arrives at 0.3 and the volumechange that got it there fired
    // before `attach` ran, so the memory has to come from `prime`.
    const store = createAtoms();
    const element = createMediaElementFake({ volume: 0.3 });
    syncFromElement(element, store);

    // Click-to-set straight to zero: one jump, no intermediate events.
    element.volume = 0;
    element.emit("volumechange");

    expect(store.lastAudibleVolume.get()).toBe(0.3);
  });
});
