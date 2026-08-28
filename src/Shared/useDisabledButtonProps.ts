import { useIsDisabled, useIsSeekable } from "../store/derived";

type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;

export type DisabledButtonProps = {
  readonly "aria-disabled": true | undefined;
  readonly onClick: ClickHandler | undefined;
};

type DisabledOptions = {
  /**
   * For a control whose action has to name a position on the track. It is
   * unavailable without a duration as well as on an error — `SeekButton` is the
   * only one, and both directions qualify, since it sends `SET_TIME_FORWARD`
   * with a negative value rather than `SET_TIME_BACKWARD`.
   */
  requiresSeekable?: boolean;
};

/**
 * Marks a control unavailable with `aria-disabled` rather than the native
 * `disabled` attribute, which takes the element out of the tab order and so
 * drops focus to `<body>` on a load-state change under a focused control.
 *
 * `aria-disabled` is advisory, so activation is blocked here instead of by the
 * browser — including the consumer's own `onClick`, which native `disabled`
 * also blocked.
 *
 * The one place that composes the two predicates, so a control cannot end up
 * announcing one and enforcing the other.
 *
 * Spread after the consumer's props, or the gate can be spread away. `theirs`
 * still replaces `ours`, as it did before the gate existed.
 */
export function useDisabledButtonProps(
  ours: ClickHandler,
  theirs: ClickHandler | undefined,
  { requiresSeekable = false }: DisabledOptions = {},
): DisabledButtonProps {
  const isErrored = useIsDisabled();
  // Read by every button, including the five that ignore it. One
  // rarely-changing atom, so the extra subscription is not worth branching for.
  const isSeekable = useIsSeekable();
  const isDisabled = isErrored || (requiresSeekable && !isSeekable);

  return {
    "aria-disabled": isDisabled || undefined,
    onClick: isDisabled ? undefined : (theirs ?? ours),
  };
}
