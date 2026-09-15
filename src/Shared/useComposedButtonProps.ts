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
 * the click that performs its action, and the media-key shortcuts. Spread the
 * result after the consumer's props, or the gate can be spread away.
 *
 * Unavailability is `aria-disabled`, not the native `disabled` attribute, which
 * takes the element out of the tab order and so drops focus to `<body>` on a
 * load-state change under a focused control (A7). Because the attribute is only
 * advisory, activation is blocked here rather than by the browser.
 *
 * The gate covers activation, not the shortcuts: the keymap is player-wide, so
 * `p` toggles play from every control whatever that control's own state.
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
  const handleMediaKeys = useHandleMediaKeys();

  return {
    "aria-disabled": isDisabled || undefined,
    onClick: isDisabled ? undefined : composeEventHandlers(props.onClick, ours),
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
 * mute and the time toggle. The other three have no state or announce it with
 * `aria-pressed`, and S9's rule refuses a second spelling of either.
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
