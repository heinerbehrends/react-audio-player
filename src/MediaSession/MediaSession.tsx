import { useEffect, useRef, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";
import { usePlayerStore } from "../store/PlayerStoreContext";

declare const process: { env: { NODE_ENV?: string } };

// `navigator.mediaSession` is one object per page, so it gets one owner per page:
// the player that most recently started playing, kept while paused. A pointer to
// whoever last claimed a browser singleton, holding no state of its own: not the
// registry B2 refused (F6).
let owner: symbol | null = null;

// What a claim rewrites. Each effect keeps its writer here, current with its
// dependencies.
type Writers = {
  metadata: () => void;
  handlers: () => void;
  state: () => void;
};

const noop = () => {};

function hasMediaSession(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

// `stop` is left out on purpose: unregistered, the X on Chrome's desktop media
// controls pauses, where `STOP_AUDIO` would also rewind.
const ACTIONS: MediaSessionAction[] = [
  "play",
  "pause",
  "seekbackward",
  "seekforward",
  "seekto",
  "previoustrack",
  "nexttrack",
];

const DEFAULT_SEEK_OFFSET = 10;

function setHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // An action the browser does not know throws `TypeError`. Its button is
    // simply not shown, which is the outcome either way.
  }
}

// Absent in older Firefox, so tested on its own rather than assumed from the
// parent object.
function hasPositionState(): boolean {
  return typeof navigator.mediaSession.setPositionState === "function";
}

function clearSession() {
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = "none";
  for (const action of ACTIONS) setHandler(action, null);
  if (hasPositionState()) navigator.mediaSession.setPositionState();
}

function reportError(what: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.error(
    `<MediaSession> could not set ${what}; the player works without it.`,
    error,
  );
}

type MediaSessionProps = {
  /**
   * Shows a previous-track button on the system controls and runs when it is
   * pressed. Without it, there is no button.
   */
  onPreviousTrack?: () => void;
  /**
   * Shows a next-track button on the system controls and runs when it is
   * pressed. Without it, there is no button.
   */
  onNextTrack?: () => void;
  /**
   * Seconds the system's skip buttons move, in both directions, when the system
   * does not name a distance itself. Defaults to `10`.
   */
  seekOffset?: number;
};

function useMediaSession(props: MediaSessionProps) {
  const { audioFile } = usePlayerConfig();
  const store = usePlayerStore();
  const [self] = useState(() => Symbol("MediaSession"));

  // The handlers read the latest props through this, so an inline callback does
  // not re-register every handler on each render.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // Every write below runs for every instance and returns early unless this one
  // owns the session, so a claim needs no subscriptions moved, only a rewrite.
  const writers = useRef<Writers>({
    metadata: noop,
    handlers: noop,
    state: noop,
  });

  // Before the writers, so the first write on mount already passes the owner
  // guard. Claiming on mount when nobody owns the session makes a single player
  // behave as if the root did it: Chrome builds the notification from the
  // metadata present when playback starts. Strict mode's second mount claims
  // again after the release.
  useEffect(() => {
    if (!hasMediaSession()) return;
    if (owner === null) owner = self;
    return () => {
      if (owner !== self) return;
      owner = null;
      clearSession();
    };
  }, [self]);

  // Keyed on content, not identity: `audioFile` is documented as safe to pass
  // inline, and `artwork` is an array.
  const { title, artist, album, artwork } = audioFile;
  const metadataKey = JSON.stringify({ title, artist, album, artwork });

  useEffect(() => {
    if (!hasMediaSession()) return;
    const fields: MediaMetadataInit = JSON.parse(metadataKey);
    const hasAny = Boolean(
      fields.title || fields.artist || fields.album || fields.artwork?.length,
    );
    const write = () => {
      if (owner !== self) return;
      try {
        // `null` rather than an "Untitled" card, and rather than keeping the
        // previous track's title when a playlist moves to an untagged one.
        navigator.mediaSession.metadata = hasAny
          ? new MediaMetadata(fields)
          : null;
      } catch (error) {
        // `MediaMetadata` throws `TypeError` on an artwork `src` that is not
        // a valid URL.
        navigator.mediaSession.metadata = null;
        reportError("the metadata", error);
      }
    };
    writers.current.metadata = write;
    write();
  }, [self, metadataKey]);

  // The OS buttons send what the keyboard map sends, so they share its path and
  // its seekable gate: a live stream ignores the skips as it ignores
  // `<SeekButton>`.
  const hasPrevious = props.onPreviousTrack !== undefined;
  const hasNext = props.onNextTrack !== undefined;

  useEffect(() => {
    if (!hasMediaSession()) return;
    const offset = (details: MediaSessionActionDetails) =>
      details.seekOffset ?? latest.current.seekOffset ?? DEFAULT_SEEK_OFFSET;

    const write = () => {
      if (owner !== self) return;
      // Two handlers, not a toggle: the OS says which it wants.
      setHandler("play", () => store.send({ type: "PLAY" }));
      setHandler("pause", () => store.send({ type: "PAUSE" }));
      setHandler("seekbackward", (details) =>
        store.send({ type: "SET_TIME_BACKWARD", value: offset(details) }),
      );
      setHandler("seekforward", (details) =>
        store.send({ type: "SET_TIME_FORWARD", value: offset(details) }),
      );
      setHandler("seekto", ({ seekTime }) => {
        // `CHANGE_VALUE` has no seekable gate, because the slider sending it is
        // disabled without a duration. The OS has no such guard: Android shows a
        // seek bar from this handler's presence alone.
        if (seekTime === undefined || !(store.duration.get() > 0)) return;
        store.send({
          type: "CHANGE_VALUE",
          component: "timeline",
          value: seekTime,
        });
      });
      // Registered only when passed: a handler is what makes the button appear,
      // and the library has no playlist to derive one from (B2).
      setHandler(
        "previoustrack",
        hasPrevious ? () => latest.current.onPreviousTrack?.() : null,
      );
      // `null` when absent also removes the previous owner's.
      setHandler(
        "nexttrack",
        hasNext ? () => latest.current.onNextTrack?.() : null,
      );
    };
    writers.current.handlers = write;
    write();
  }, [self, store, hasPrevious, hasNext]);

  // Subscribed outside React, so none of this costs a render. The OS
  // interpolates the scrubber from the last write, so it needs one only when
  // something it cannot predict happens; `currentSecond` catches nearly every
  // seek, and a seek within one second is off by under a second until the next.
  useEffect(() => {
    if (!hasMediaSession()) return;
    const session = navigator.mediaSession;
    // Whether a position may be on the session, so that one is cleared rather
    // than left behind. Assumed on a claim: the previous owner may have set it.
    let hasPosition = false;

    const writePosition = () => {
      if (owner !== self || !hasPositionState()) return;
      // `0` stands for both "no metadata yet" and `Infinity`, a live stream.
      const duration = store.duration.get();
      const playbackRate = store.rate.get();
      try {
        if (duration > 0 && playbackRate !== 0) {
          session.setPositionState({
            duration,
            playbackRate,
            // Chrome reports `currentTime` past `duration` for about 0.5 s
            // after `ended`, and `setPositionState` throws on that.
            position: Math.min(store.currentTime.get(), duration),
          });
          hasPosition = true;
        } else if (hasPosition) {
          // A track swapped for a live stream would otherwise keep its
          // scrubber.
          session.setPositionState();
          hasPosition = false;
        }
      } catch (error) {
        reportError("the position state", error);
      }
    };

    // Set explicitly: the browser guesses from whichever element it thinks is
    // current, and with two players on a page it guesses wrong.
    const writePlaybackState = () => {
      if (owner !== self) return;
      session.playbackState = store.paused.get() ? "paused" : "playing";
    };

    const write = () => {
      writePlaybackState();
      writePosition();
    };
    writers.current.state = () => {
      hasPosition = true;
      write();
    };
    write();
    const unsubscribes = [
      store.currentSecond.subscribe(writePosition),
      store.duration.subscribe(writePosition),
      store.rate.subscribe(writePosition),
      store.paused.subscribe(() => {
        // Starting playback claims the session. Pausing does not release it:
        // the lock screen keeps the paused track with a play button.
        if (!store.paused.get() && owner !== self) {
          owner = self;
          writers.current.metadata();
          writers.current.handlers();
          writers.current.state();
          return;
        }
        write();
      }),
    ];
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [self, store]);
}

/**
 * Publishes the track to the operating system's media controls: the lock
 * screen, the notification shade, the desktop media overlay. Renders nothing.
 * Render it inside `<AudioPlayer>`, once per player that should own those
 * controls; leave it out for a sound effect or a preview clip.
 *
 * Reads `title`, `artist`, `album` and `artwork` from `audioFile`. With none of
 * them set, the session carries no metadata. Play, pause and the skip and seek
 * buttons drive the player; previous and next appear only with their handlers.
 * Where the browser has no Media Session API it does nothing.
 */
export function MediaSession(props: MediaSessionProps): null {
  useMediaSession(props);
  return null;
}
