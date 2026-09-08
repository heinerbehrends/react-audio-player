import { useIsDisabled, useIsSeekable } from "../store/derived";

type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;

export type DisabledButtonProps = {
  readonly "aria-disabled": true | undefined;
  readonly onClick: ClickHandler | undefined;
};

type DisabledOptions = {
  /**
   * Also disable without a duration, not only on an error. For a control whose
   * action names a position on the track — `SeekButton` is the only one.
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
 * Composes both predicates in one place, so a control cannot announce one and
 * enforce the other.
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
  // Every button subscribes, including the five that ignore it: one
  // rarely-changing atom, too cheap to branch on.
  const isSeekable = useIsSeekable();
  const isDisabled = isErrored || (requiresSeekable && !isSeekable);

  return {
    "aria-disabled": isDisabled || undefined,
    onClick: isDisabled ? undefined : (theirs ?? ours),
  };
}
