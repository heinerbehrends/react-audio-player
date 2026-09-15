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
