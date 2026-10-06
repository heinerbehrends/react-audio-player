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

/** The props every button hook returns, on top of the caller's own. */
export type ButtonBagBase = ComposedButtonProps & {
  /** Always `"button"`, so the element never submits a form. */
  readonly type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  /** The accessible name, from `labels` or the English default. */
  readonly "aria-label": string;
  /** A stable selector for the control; `aria-label` is translatable, so it is not one. */
  readonly "data-part": string;
};

/**
 * A button hook's result: the caller's props `P` with the library's on top.
 * Generic so the caller's own keys, `data-*` included, stay typed in the result.
 */
export type ButtonPropsBag<P> = Omit<P, keyof ButtonBagBase> & ButtonBagBase;

/**
 * A `ButtonPropsBag` with `data-state`, for the buttons whose state the DOM does
 * not already carry. The values are API: a stylesheet selects on them.
 */
export type StatefulButtonPropsBag<
  P,
  State extends string,
> = ButtonPropsBag<P> & {
  readonly "data-state": State;
};
