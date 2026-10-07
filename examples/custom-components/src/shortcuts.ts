import type {
  KeyboardAction,
  KeyToActionMap,
} from "react-headless-audio-player";

// The player's own keys, in one list: the map the player gets and the panel
// beside it are both built from it, so what is shown and what works cannot
// drift apart. A key not named here keeps its default binding: `k` and Space
// play and pause, `m` mutes, the arrows seek 5 seconds.

export type Binding = {
  /** A `KeyboardEvent.key` value. */
  key: string;
  /** What the key does, or `null` to unbind it and let it reach the browser. */
  action: KeyboardAction | null;
  /** The panel's text. */
  label: string;
};

export const BINDINGS: Binding[] = [
  // The two seek buttons' sizes, on the keyboard too. The defaults step 5 and
  // 10 seconds.
  {
    key: "f",
    action: { type: "SET_TIME_FORWARD", value: 30 },
    label: "30 Sekunden vor",
  },
  {
    key: "d",
    action: { type: "SET_TIME_BACKWARD", value: 15 },
    label: "15 Sekunden zurück",
  },
  // The three rate buttons. By default `1` to `3` jump to 10–30 % of the
  // track, which the slider already covers.
  {
    key: "1",
    action: { type: "SET_PLAYBACK_RATE", playbackRate: 1 },
    label: "Normale Geschwindigkeit",
  },
  {
    key: "2",
    action: { type: "SET_PLAYBACK_RATE", playbackRate: 1.5 },
    label: "1,5-fache Geschwindigkeit",
  },
  {
    key: "3",
    action: { type: "SET_PLAYBACK_RATE", playbackRate: 2 },
    label: "Doppelte Geschwindigkeit",
  },
  // Unbound: `k` and Space already play and pause, so `p` goes back to the
  // page.
  {
    key: "p",
    action: null,
    label: "Nicht belegt. Abspielen und Pause: K oder Leertaste",
  },
];

// A letter arrives as its lower case, or as its upper case with Shift held.
// Bind both, as the defaults do; `null` has to cover both as well, or Shift+P
// would still play.
export const shortcuts: KeyToActionMap = Object.fromEntries(
  BINDINGS.flatMap(({ key, action }) => {
    const upper = key.toUpperCase();
    return upper === key
      ? [[key, action]]
      : [
          [key, action],
          [upper, action],
        ];
  }),
);
