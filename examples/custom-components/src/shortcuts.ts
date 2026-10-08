import type { Shortcut, Shortcuts } from "react-headless-audio-player";

// The player's own keys, in one list: the map the player gets and the panel
// beside it are both built from it, so what is shown and what works cannot
// drift apart. A key not named here keeps its default binding: `k` plays and
// pauses, `m` mutes, the left and right arrows seek 5 seconds.

export type Binding = {
  /** A `KeyboardEvent.key` value. Letters match either case. */
  key: string;
  /** What the key does, or `null` to unbind it and let it reach the browser. */
  shortcut: Shortcut | null;
  /** The panel's text. */
  label: string;
};

export const BINDINGS: Binding[] = [
  // The two seek buttons' sizes, on the keyboard too. The defaults step 5 and
  // 10 seconds.
  {
    key: "f",
    shortcut: ({ seekBy }) => seekBy(30),
    label: "30 Sekunden vor",
  },
  {
    key: "d",
    shortcut: ({ seekBy }) => seekBy(-15),
    label: "15 Sekunden zurück",
  },
  // The three rate buttons. By default `1` to `3` jump to 10–30 % of the
  // track, which the slider already covers.
  {
    key: "1",
    shortcut: ({ setRate }) => setRate(1),
    label: "Normale Geschwindigkeit",
  },
  {
    key: "2",
    shortcut: ({ setRate }) => setRate(1.5),
    label: "1,5-fache Geschwindigkeit",
  },
  {
    key: "3",
    shortcut: ({ setRate }) => setRate(2),
    label: "Doppelte Geschwindigkeit",
  },
  // Unbound: `k` already plays and pauses, so `p` goes back to the page.
  {
    key: "p",
    shortcut: null,
    label: "Nicht belegt. Abspielen und Pause: K",
  },
];

export const shortcuts: Shortcuts = Object.fromEntries(
  BINDINGS.map(({ key, shortcut }) => [key, shortcut]),
);
