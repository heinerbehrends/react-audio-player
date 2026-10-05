import { handleSideEffect } from "../AudioElement/handleSideEffect";
import type { SideEffectAction } from "../AudioElement/sideEffectActions";
import { atom, readable, type ReadableAtom } from "./atom";
import {
  syncFromElement,
  type LoadState,
  type ProjectionAtoms,
} from "./syncFromElement";

export type PlayerStore = {
  // Read-only projections of the audio element. Only `syncFromElement` writes
  // them, and only `attach` reaches it.
  currentTime: ReadableAtom<number>;
  currentSecond: ReadableAtom<number>;
  duration: ReadableAtom<number>;
  isLive: ReadableAtom<boolean>;
  volume: ReadableAtom<number>;
  muted: ReadableAtom<boolean>;
  lastAudibleVolume: ReadableAtom<number>;
  rate: ReadableAtom<number>;
  paused: ReadableAtom<boolean>;
  readyState: ReadableAtom<number>;
  mediaErrorCode: ReadableAtom<number | null>;
  loadState: ReadableAtom<LoadState>;

  /**
   * The name of the `DOMException` from the last refused `play()`, or `null`.
   *
   * Not a projection — there is no element property for "the browser said no" —
   * so `send` writes it. It clears when a `play()` finally succeeds, and
   * deliberately not on a `src` change: an autoplay block outlives the track
   * that revealed it.
   */
  playbackError: ReadableAtom<string | null>;

  send: (action: SideEffectAction) => void;
  /**
   * Freezes `lastAudibleVolume` for the duration of a volume drag and returns
   * its release. Holds are counted, so overlapping ones are safe, and each
   * release is idempotent. It only suppresses writes, never makes them.
   */
  holdAudibleVolume: () => () => void;
  /** Binds the store to an element and returns the detach function. */
  attach: (element: HTMLAudioElement) => () => void;
  /**
   * Called after a `src` swap: plays the new track if playback was wanted
   * before it, which a swap does not change. Wanted means a `play` sent or
   * observed and not since revoked by a pause. A pause at the natural end
   * keeps it only until the user acts or the element seeks, so a playlist
   * advanced from `onEnded` carries on (F13) but a later swap does not (F14).
   */
  continuePlayback: () => void;
  /** Revokes an intent held only by a natural end, as a user's own action does. */
  expireEndedIntent: () => void;
};

export function createPlayerStore(): PlayerStore {
  const atoms: ProjectionAtoms = {
    currentTime: atom(0),
    currentSecond: atom(0),
    duration: atom(0),
    isLive: atom(false),
    volume: atom(1),
    muted: atom(false),
    lastAudibleVolume: atom(1),
    rate: atom(1),
    paused: atom(true),
    readyState: atom(0),
    mediaErrorCode: atom<number | null>(null),
    loadState: atom<LoadState>("loading"),
  };

  // Not atoms: nothing subscribes to either, and an atom would come with a
  // `set` handle that the read-only projections then have to forbid.
  let element: HTMLAudioElement | null = null;
  let audibleVolumeHolds = 0;
  // Whether the user wants playback, recorded when a command is sent rather
  // than when the element's event arrives: the `play` event is a task late, and
  // a click that plays and swaps the track commits the swap before it.
  let playWanted = false;
  // Removes the listeners that expire an intent kept through a natural end, or
  // `null` when none is armed.
  let disarmEndedIntent: (() => void) | null = null;

  const setPlayWanted = (wanted: boolean) => {
    disarmEndedIntent?.();
    playWanted = wanted;
  };

  // The intent survives a natural end only for the swap that follows from it
  // (F14). A user's pointer or key, or a seek — Chrome fires no `pause` on a
  // paused seek back from the end — means whatever comes next is theirs.
  const armEndedIntent = (target: HTMLAudioElement) => {
    if (disarmEndedIntent) return;
    const doc = target.ownerDocument;
    const expire = () => setPlayWanted(false);
    const options = { capture: true };
    target.addEventListener("seeking", expire);
    doc.addEventListener("pointerdown", expire, options);
    doc.addEventListener("keydown", expire, options);
    disarmEndedIntent = () => {
      target.removeEventListener("seeking", expire);
      doc.removeEventListener("pointerdown", expire, options);
      doc.removeEventListener("keydown", expire, options);
      disarmEndedIntent = null;
    };
  };

  const holdAudibleVolume = () => {
    audibleVolumeHolds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      audibleVolumeHolds -= 1;
    };
  };

  // Playback started or stopped by something other than `send`: native
  // controls, `autoplay`, a consumer holding the element. Each handler checks the
  // element first, so an event made stale by a later command changes nothing.
  // A swap fires no `pause` (measured in Chrome and Firefox), so it leaves the
  // intent alone. Firefox's `ended` on a paused seek to the end fires no
  // `pause` either (B4), so a paused player stays unwanted.
  const onPlay = () => {
    if (element && !element.paused) setPlayWanted(true);
  };
  const onPause = () => {
    if (!element || !element.paused) return;
    if (!element.ended) setPlayWanted(false);
    else if (playWanted) armEndedIntent(element);
  };

  const attach = (nextElement: HTMLAudioElement) => {
    element = nextElement;
    setPlayWanted(!nextElement.paused);
    const detach = syncFromElement(nextElement, atoms, {
      isAudibleVolumePinned: () => audibleVolumeHolds > 0,
    });
    nextElement.addEventListener("play", onPlay);
    nextElement.addEventListener("pause", onPause);
    return () => {
      detach();
      nextElement.removeEventListener("play", onPlay);
      nextElement.removeEventListener("pause", onPause);
      if (element === nextElement) {
        disarmEndedIntent?.();
        element = null;
      }
    };
  };

  const playbackError = atom<string | null>(null);

  const send = (action: SideEffectAction) => {
    if (action.type === "PLAY") setPlayWanted(true);
    if (action.type === "PAUSE" || action.type === "STOP_AUDIO") {
      setPlayWanted(false);
    }
    if (action.type === "TOGGLE_PLAY" && element) {
      setPlayWanted(element.paused);
    }

    const started = handleSideEffect(action, element, {
      lastAudibleVolume: atoms.lastAudibleVolume.get(),
    });
    if (!started) return;

    started.then(
      () => playbackError.set(null),
      (rejection: unknown) => {
        const name =
          (rejection as { name?: string } | null | undefined)?.name ??
          "UnknownError";
        // A `pause()` or `src` change overtook the request — a double-click or a
        // held key. The user's intent was honoured, so there is nothing to
        // report.
        if (name === "AbortError") return;
        // An autoplay refusal would only be repeated by the next swap. Any other —
        // a 404's `NotSupportedError` — is the track's, so the next one plays.
        if (name === "NotAllowedError") setPlayWanted(false);
        playbackError.set(name);
      },
    );
  };

  return {
    currentTime: readable(atoms.currentTime),
    currentSecond: readable(atoms.currentSecond),
    duration: readable(atoms.duration),
    isLive: readable(atoms.isLive),
    volume: readable(atoms.volume),
    muted: readable(atoms.muted),
    lastAudibleVolume: readable(atoms.lastAudibleVolume),
    rate: readable(atoms.rate),
    paused: readable(atoms.paused),
    readyState: readable(atoms.readyState),
    mediaErrorCode: readable(atoms.mediaErrorCode),
    loadState: readable(atoms.loadState),
    playbackError: readable(playbackError),
    send,
    holdAudibleVolume,
    attach,
    // A media-session track button reaches the page without a pointer or a
    // key, so `<MediaSession>` calls this itself.
    expireEndedIntent: () => {
      if (disarmEndedIntent) setPlayWanted(false);
    },
    continuePlayback: () => {
      if (playWanted) send({ type: "PLAY" });
    },
  };
}
