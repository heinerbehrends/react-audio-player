import { useSyncExternalStore } from "react";

let probe: boolean | undefined;

/**
 * Whether this browser lets a page set `HTMLMediaElement.volume`. iOS Safari
 * does not: the level belongs to the hardware rocker, a write is accepted and
 * ignored, and the property reads `1` (D3). `muted` is unaffected.
 *
 * Probed once per page on a detached element, as Plyr does, so nothing is
 * written to the player's element and no `volumechange` fires.
 */
export function isVolumeAvailable(): boolean {
  if (probe === undefined) {
    const element = document.createElement("audio");
    element.volume = 0.5;
    probe = element.volume === 0.5;
  }
  return probe;
}

/** Tests only: forget the probe so the next call asks the browser again. */
export function resetVolumeProbe() {
  probe = undefined;
}

// The answer never changes within a page, so there is nothing to subscribe to.
const subscribe = () => () => {};
// Assumed on the server, where there is no element to ask. A hydrating client
// renders this first and then corrects itself, so a `<Volume>` rendered
// conditionally on it does not mismatch.
const serverSnapshot = () => true;

/**
 * Whether this browser lets a page set the volume. `false` on iOS, where
 * `<Volume.Control>` is disabled; use it to leave `<Volume>` out and keep
 * `<MuteButton>`. The one hook that works outside `<AudioPlayer>`.
 */
export function useIsVolumeAvailable(): boolean {
  return useSyncExternalStore(subscribe, isVolumeAvailable, serverSnapshot);
}
