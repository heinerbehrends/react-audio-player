import type { MediaElementFake } from "./mediaElementFake";

/** A listener registry with the test-side `emit` the other fakes have. */
function createListeners() {
  const listeners = new Map<string, Array<() => void>>();
  return {
    addEventListener: (event: string, listener: () => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
    removeEventListener: (event: string, listener: () => void) => {
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((each) => each !== listener),
      );
    },
    emit: (event: string) => {
      [...(listeners.get(event) ?? [])].forEach((listener) => listener());
    },
    listenerCount: (event: string) => listeners.get(event)?.length ?? 0,
  };
}

type Listeners = ReturnType<typeof createListeners>;

/** A cue; without `text`, one that has no `getCueAsHTML`, like a `DataCue`. */
export type CueInit = {
  id?: string;
  start: number;
  end: number;
  text?: string;
};

export type TextTrackInit = {
  kind?: TextTrackKind;
  language?: string;
  mode?: TextTrackMode;
  /** The `<track>` element's `default` attribute. */
  default?: boolean;
  cues: CueInit[];
  /**
   * Without a `<track>` element: a track from `addTextTrack()`, whose cues are
   * there from the start, since `addCue` fires nothing.
   */
  scripted?: boolean;
};

/**
 * A `TextTrack` and the `<track>` element behind it, as the browser has them
 * before the file arrives: `cues` is `null` and the element is `LOADING`. The
 * element is a real `<track>`, so its `src` can be observed, with the
 * listeners replaced by the registry.
 */
export type TextTrackFake = {
  track: TextTrack & Listeners;
  element: (HTMLTrackElement & Listeners) | null;
  /** Fills `cues`, marks the element `LOADED` and fires its `load`. */
  load: () => void;
  /** Marks the element `ERROR` and fires its `error`. */
  fail: () => void;
  /** Makes these cues active, none for `-1`, and fires `cuechange`. */
  play: (...indices: number[]) => void;
};

export function createTextTrackFake({
  kind = "subtitles",
  language = "en",
  mode = "disabled",
  default: isDefault = false,
  cues,
  scripted = false,
}: TextTrackInit): TextTrackFake {
  const cueObjects = cues.map(({ id = "", start, end, text }) => ({
    id,
    startTime: start,
    endTime: end,
    ...(text === undefined
      ? {}
      : {
          // Parsed as HTML, which strips the VTT tags and decodes the entities
          // as the browser's own cue parser does for these cases.
          getCueAsHTML: () => {
            const template = document.createElement("template");
            template.innerHTML = text;
            return template.content;
          },
        }),
  }));
  const track = {
    ...createListeners(),
    kind,
    language,
    mode,
    cues: (scripted ? cueObjects : null) as unknown[] | null,
    activeCues: [] as unknown[],
  };
  const element = scripted
    ? null
    : Object.defineProperties(
        Object.assign(document.createElement("track"), {
          ...createListeners(),
          default: isDefault,
        }),
        {
          track: { value: track },
          readyState: { value: 1, writable: true },
        },
      );

  return {
    track: track as unknown as TextTrackFake["track"],
    element: element as unknown as TextTrackFake["element"],
    load: () => {
      track.cues = cueObjects;
      if (!element) return;
      Object.assign(element, { readyState: 2 });
      element.emit("load");
    },
    fail: () => {
      if (!element) return;
      Object.assign(element, { readyState: 3 });
      element.emit("error");
    },
    play: (...indices) => {
      track.activeCues = indices
        .filter((index) => index !== -1)
        .map((index) => cueObjects[index]);
      track.emit("cuechange");
    },
  };
}

export type TextTrackListFake = Listeners & {
  /** Adds a track as a `<track>` child would, and fires `addtrack`. */
  add: (fake: TextTrackFake) => void;
  /** Takes a track out as removing the `<track>` would, and fires `removetrack`. */
  remove: (fake: TextTrackFake) => void;
};

/**
 * Gives the media-element fake a `textTracks` list and the `querySelectorAll`
 * that finds the `<track>` children, holding `tracks` from the start.
 */
export function withTextTracks(
  media: MediaElementFake,
  tracks: TextTrackFake[] = [],
): TextTrackListFake {
  const items = [...tracks];
  // Defined, not assigned: `Object.assign` would copy `length` once, as 0.
  const list = Object.defineProperty(createListeners(), "length", {
    get: () => items.length,
  }) as Listeners & Partial<TextTrackListFake>;
  // Index `i` reads whatever is at that position now.
  const defineIndex = (i: number) =>
    Object.defineProperty(list, i, {
      get: () => items[i]?.track,
      configurable: true,
    });
  items.forEach((_, i) => defineIndex(i));
  Object.assign(list, {
    add: (fake: TextTrackFake) => {
      items.push(fake);
      defineIndex(items.length - 1);
      list.emit("addtrack");
    },
    remove: (fake: TextTrackFake) => {
      const at = items.indexOf(fake);
      if (at === -1) return;
      items.splice(at, 1);
      delete (list as Record<number, unknown>)[items.length];
      list.emit("removetrack");
    },
  });

  Object.assign(media, {
    textTracks: list,
    querySelectorAll: (selector: string) =>
      selector === "track"
        ? items.flatMap((fake) => (fake.element ? [fake.element] : []))
        : [],
  });
  return list as TextTrackListFake;
}
