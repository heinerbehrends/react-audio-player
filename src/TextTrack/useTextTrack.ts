import { useMemo, useSyncExternalStore } from "react";
import { useStore } from "../store/atom";
import { usePlayerStore } from "../store/PlayerStoreContext";

/** One timed entry of a text track, copied out of the browser's cue. */
export type Cue = {
  /** The cue's identifier in the file, or `""` without one. */
  id: string;
  /** Where the cue starts, in seconds. */
  start: number;
  /** Where it ends, in seconds. */
  end: number;
  /** The cue's text, with VTT markup stripped; `""` for a cue without one. */
  text: string;
};

/** What `useTextTrack()` returns. */
export type TextTrackState = {
  /** Every cue, in order, as plain objects; empty until the track has loaded. */
  cues: readonly Cue[];
  /** The index in `cues` of the cue playing now, or `-1` between cues. */
  activeIndex: number;
  /** `"none"` without a matching `<track>`, then `"loading"`, `"ready"` or `"error"`. */
  status: "none" | "loading" | "ready" | "error";
};

/** Which `<track>` `useTextTrack()` reads. */
export type TextTrackOptions = {
  /** The kind to read. Defaults to `"subtitles"`, else `"captions"`. */
  kind?: TextTrackKind | undefined;
  /** The `srclang` to prefer when several tracks match. */
  language?: string | undefined;
};

const NONE: TextTrackState = { cues: [], activeIndex: -1, status: "none" };
const subscribeNone = () => () => {};
const getNone = () => NONE;

// `HTMLTrackElement.readyState`: NONE, LOADING, LOADED, ERROR.
const STATUS = ["loading", "loading", "ready", "error"] as const;

type Found = { track: TextTrack; element: HTMLTrackElement | null } | null;

/** The `<track>` to read: the kind, then the language, then `default`, then the first. */
function findTrack(
  audio: HTMLMediaElement,
  { kind, language }: TextTrackOptions,
): Found {
  const tracks = Array.from(audio.textTracks);
  const elements = Array.from(audio.querySelectorAll("track"));
  const elementOf = (track: TextTrack) =>
    elements.find((element) => element.track === track) ?? null;

  for (const wanted of kind ? [kind] : (["subtitles", "captions"] as const)) {
    const ofKind = tracks.filter((track) => track.kind === wanted);
    const inLanguage = ofKind.filter((track) => track.language === language);
    const pool = inLanguage.length > 0 ? inLanguage : ofKind;
    const track =
      pool.find((candidate) => elementOf(candidate)?.default) ?? pool[0];
    if (track) return { track, element: elementOf(track) };
  }
  return null;
}

// The browser's own parse of the cue: VTT tags stripped, entities decoded. A
// cue without text, such as a `DataCue` on a metadata track, reads as `""`.
const plainText = (cue: TextTrackCue) =>
  "getCueAsHTML" in cue
    ? ((cue as VTTCue).getCueAsHTML().textContent ?? "")
    : "";

/**
 * One subscription's view of the element's text tracks. The snapshot is a
 * cached object, replaced only when the cues, the active cue or the status
 * changed, so a render with nothing new bails out.
 */
function createSource(audio: HTMLMediaElement, options: TextTrackOptions) {
  let state = NONE;
  // The browser's cue objects behind `state.cues`, to find the active one by
  // identity and to tell a reload from a `cuechange`.
  let raw: TextTrackCue[] = [];

  const read = (found: Found, reloading: boolean): TextTrackState => {
    if (!found) {
      raw = [];
      return NONE;
    }
    const { track, element } = found;
    const status = reloading
      ? "loading"
      : element
        ? (STATUS[element.readyState] ?? "loading")
        : // A track added from script has no `<track>` behind it to report on.
          track.cues
          ? "ready"
          : "loading";
    // No cues until the file has loaded, whatever the browser still holds of
    // the previous one while a new `src` is on its way.
    if (status !== "ready") {
      raw = [];
      return { cues: NONE.cues, activeIndex: -1, status };
    }
    const list = Array.from(track.cues ?? []);
    const changed =
      list.length !== raw.length || list.some((cue, i) => cue !== raw[i]);
    if (changed) raw = list;
    const cues = changed
      ? list.map((cue) => ({
          id: cue.id,
          start: cue.startTime,
          end: cue.endTime,
          text: plainText(cue),
        }))
      : state.cues;
    // `activeCues` is in start order, and the last is the one that began most
    // recently: Chromium keeps a cue active at its exact end, so a sentence
    // and the one it hands over to are both active at the boundary.
    const activeCues = track.activeCues;
    const active = activeCues?.[activeCues.length - 1];
    return { cues, activeIndex: active ? raw.indexOf(active) : -1, status };
  };

  const subscribe = (notify: () => void) => {
    let found: Found = null;
    // A new `src` on the `<track>` makes the browser fetch again, with no
    // event until the file lands or fails.
    let reloading = false;

    const update = () => {
      const next = read(found, reloading);
      if (
        next.cues === state.cues &&
        next.activeIndex === state.activeIndex &&
        next.status === state.status
      ) {
        return;
      }
      state = next;
      notify();
    };

    const settled = () => {
      reloading = false;
      update();
    };
    const sourceChanged = () => {
      reloading = true;
      update();
    };
    const observer = new MutationObserver(sourceChanged);

    const unbind = () => {
      found?.track.removeEventListener("cuechange", update);
      found?.element?.removeEventListener("load", settled);
      found?.element?.removeEventListener("error", settled);
      observer.disconnect();
    };

    // Run again on every change to the list: a `<track>` added after mount,
    // one removed, or a mode change elsewhere.
    const bind = () => {
      const next = findTrack(audio, options);
      if (next?.track !== found?.track) {
        unbind();
        found = next;
        reloading = false;
        found?.track.addEventListener("cuechange", update);
        found?.element?.addEventListener("load", settled);
        found?.element?.addEventListener("error", settled);
        if (found?.element) {
          observer.observe(found.element, { attributeFilter: ["src"] });
        }
      }
      // A `<track>` without `default` stays disabled and never fetches.
      // `"hidden"` loads it; on `<audio>` it draws nothing either way.
      if (found?.track.mode === "disabled") found.track.mode = "hidden";
      update();
    };

    const list = audio.textTracks;
    for (const type of ["addtrack", "removetrack", "change"]) {
      list.addEventListener(type, bind);
    }
    bind();

    return () => {
      for (const type of ["addtrack", "removetrack", "change"]) {
        list.removeEventListener(type, bind);
      }
      unbind();
    };
  };

  return { subscribe, getSnapshot: () => state };
}

/**
 * Reads a `<track>` child of the `<audio>` element as React data: its cues, the
 * one playing now, and whether it has loaded. For a transcript from a WebVTT
 * file; a transcript you hold as data needs no hook. Opt-in: a separate import.
 */
export function useTextTrack(options: TextTrackOptions = {}): TextTrackState {
  const { kind, language } = options;
  const element = useStore(usePlayerStore().element);
  const source = useMemo(
    () =>
      element?.textTracks ? createSource(element, { kind, language }) : null,
    [element, kind, language],
  );
  return useSyncExternalStore(
    source?.subscribe ?? subscribeNone,
    source?.getSnapshot ?? getNone,
    getNone,
  );
}
