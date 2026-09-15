import { composeEventHandlers } from "./composeEventHandlers";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useIsDisabled, useIsSeekable } from "../store/derived";

type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;
type KeyDownHandler = React.KeyboardEventHandler<HTMLButtonElement>;

export type ComposedButtonProps = {
  readonly "aria-disabled": true | undefined;
  readonly onClick: ClickHandler | undefined;
  readonly onKeyDown: KeyDownHandler;
};

type ComposedOptions = {
  /**
   * Also disable without a duration, not only on an error. For a control whose
   * action names a position on the track — `SeekButton` is the only one.
   */
  requiresSeekable?: boolean;
};

/**
 * The three props every button in this library controls: the availability gate,
 * the click that performs its action, and the media-key shortcuts.
 *
 * Unavailability is marked with `aria-disabled` rather than the native
 * `disabled` attribute, which takes the element out of the tab order and so
 * drops focus to `<body>` on a load-state change under a focused control. Both
 * predicates are composed in one place, so a control cannot announce one and
 * enforce the other.
 *
 * Spread the result after the consumer's props, or the gate can be spread away.
 *
 * **Your handlers run alongside the library's rather than replacing them** —
 * yours first, ours second, and `preventDefault()` in yours opts out of ours.
 * This is the rule `SliderControl` and `SliderThumb` already follow.
 *
 * **The gate covers activation, not the shortcuts.** While `aria-disabled` no
 * `onClick` runs at all, the consumer's included — `aria-disabled` is advisory,
 * so activation is blocked here instead of by the browser. The media keys keep
 * firing, because the keymap is player-wide: `p` toggles play from every
 * control, and gating it on *this* button's state would mean `p` working from
 * five buttons and not from `SeekButton` on an unseekable track, when
 * seekability has nothing to do with play/pause.
 *
 * **`preventDefault()` costs more on keydown than on click.** On a `<button>`
 * it is also how `Enter` and `Space` activation is cancelled, so one called
 * unconditionally in your `onKeyDown` silently removes keyboard activation.
 * Scope it to the key you are handling. It is not the way to turn the shortcuts
 * off — pass `{ p: null }` in `customKeyboardShortcuts` to unbind a key and let
 * it through to the browser.
 */
export function useComposedButtonProps(
  ours: ClickHandler,
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
  { requiresSeekable = false }: ComposedOptions = {},
): ComposedButtonProps {
  const isErrored = useIsDisabled();
  // Every button subscribes, including the five that ignore it: one
  // rarely-changing atom, too cheap to branch on.
  const isSeekable = useIsSeekable();
  const isDisabled = isErrored || (requiresSeekable && !isSeekable);
  // Called here rather than in each of the six: `ours` was identical in all of
  // them.
  const handleMediaKeys = useHandleMediaKeys();

  return {
    "aria-disabled": isDisabled || undefined,
    onClick: isDisabled ? undefined : composeEventHandlers(props.onClick, ours),
    // `handleMediaKeys` returns a boolean where `composeEventHandlers` types
    // `ours` as returning void. That is assignable, and React ignores a
    // handler's return value, so the boolean simply goes nowhere.
    onKeyDown: composeEventHandlers(props.onKeyDown, handleMediaKeys),
  };
}

/** Always present in a props hook's result: the consumer's, or the library's. */
export type ButtonBagBase = ComposedButtonProps & {
  readonly type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  readonly "aria-label": string;
  /**
   * A stable selector, because `aria-label` is not one: the label is the
   * documented way to localise a control (A15), so
   * `button[aria-label="Play audio"]` breaks the day the app ships in German.
   */
  readonly "data-part": string;
};

/**
 * What the button props hooks return: the consumer's props with the library's
 * on top.
 *
 * Generic in `P`, because a plain `ButtonHTMLAttributes` parameter rejects
 * `data-*` with TS2353 — JSX exempts those attributes, a function argument does
 * not. `P` also keeps the consumer's keys in the result, so `bag["data-testid"]`
 * still reads as `string`.
 */
export type ButtonPropsBag<P> = Omit<P, keyof ButtonBagBase> & ButtonBagBase;

/**
 * The bag of a button whose state the DOM does not already carry — play/pause,
 * mute and the time toggle. The other three have no state, or announce it with
 * `aria-pressed`, and a second spelling of a state already in the DOM is what
 * S9's rule refuses.
 *
 * `State` is public API: once a hook hands out `data-state="loading"`, renaming
 * that value breaks a consumer's stylesheet.
 */
export type StatefulButtonPropsBag<
  P,
  State extends string,
> = ButtonPropsBag<P> & {
  readonly "data-state": State;
};
