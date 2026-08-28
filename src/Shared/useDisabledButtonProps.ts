import { useIsDisabled } from "../store/derived";

type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;

export type DisabledButtonProps = {
  readonly "aria-disabled": true | undefined;
  readonly onClick: ClickHandler | undefined;
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
 * Spread after the consumer's props, or the gate can be spread away. `theirs`
 * still replaces `ours`, as it did before the gate existed.
 */
export function useDisabledButtonProps(
  ours: ClickHandler,
  theirs: ClickHandler | undefined,
): DisabledButtonProps {
  const isDisabled = useIsDisabled();

  return {
    "aria-disabled": isDisabled || undefined,
    onClick: isDisabled ? undefined : (theirs ?? ours),
  };
}
