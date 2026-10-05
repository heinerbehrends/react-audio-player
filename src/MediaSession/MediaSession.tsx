import { useEffect, useState } from "react";
import { usePlayerConfig } from "../Player/PlayerConfigContext";

declare const process: { env: { NODE_ENV?: string } };

// `navigator.mediaSession` is one object per page, so it gets one owner per page.
// A pointer to whoever last claimed a browser singleton, holding no state of its
// own: not the registry B2 refused (F6).
let owner: symbol | null = null;

function hasMediaSession(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

function reportError(what: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.error(
    `<MediaSession> could not set ${what}; the player works without it.`,
    error,
  );
}

function useMediaSession() {
  const { audioFile } = usePlayerConfig();
  const [self] = useState(() => Symbol("MediaSession"));

  // Before the metadata effect, so the first write on mount already passes the
  // owner guard. Strict mode's second mount claims again after the release.
  useEffect(() => {
    if (!hasMediaSession()) return;
    if (owner === null) owner = self;
    return () => {
      if (owner !== self) return;
      owner = null;
      navigator.mediaSession.metadata = null;
    };
  }, [self]);

  // Keyed on content, not identity: `audioFile` is documented as safe to pass
  // inline, and `artwork` is an array.
  const { title, artist, album, artwork } = audioFile;
  const metadataKey = JSON.stringify({ title, artist, album, artwork });

  useEffect(() => {
    if (!hasMediaSession() || owner !== self) return;
    const fields: MediaMetadataInit = JSON.parse(metadataKey);
    const hasAny = Boolean(
      fields.title || fields.artist || fields.album || fields.artwork?.length,
    );
    try {
      // `null` rather than an "Untitled" card, and rather than keeping the
      // previous track's title when a playlist moves to an untagged one.
      navigator.mediaSession.metadata = hasAny
        ? new MediaMetadata(fields)
        : null;
    } catch (error) {
      // `MediaMetadata` throws `TypeError` on an artwork `src` that is not a
      // valid URL.
      navigator.mediaSession.metadata = null;
      reportError("the metadata", error);
    }
  }, [self, metadataKey]);
}

/**
 * Publishes the track to the operating system's media controls: the lock
 * screen, the notification shade, the desktop media overlay. Renders nothing.
 * Render it inside `<AudioPlayer>`, once per player that should own those
 * controls; leave it out for a sound effect or a preview clip.
 *
 * Reads `title`, `artist`, `album` and `artwork` from `audioFile`. With none of
 * them set, the session carries no metadata. Where the browser has no Media
 * Session API it does nothing.
 */
export function MediaSession(): null {
  useMediaSession();
  return null;
}
