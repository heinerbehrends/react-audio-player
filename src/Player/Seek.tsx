import { useCallback } from "react";
import { useHandleMediaKeys } from "../KeyboardControls/handleMediaKeys";
import { useIsDisabled } from "../Shared/useIsDisabled";
import { useHandleSideEffect } from "../AudioElement/useHandleSideEffect";

type SeekButtonComponentProps = {
  children: React.ReactNode;
  amount: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Seek({ children, amount, ...props }: SeekButtonComponentProps) {
  const seekAmount = useSeek(amount);
  const handleMediaKeys = useHandleMediaKeys();
  const isDisabled = useIsDisabled();

  return (
    <button
      aria-label={`Seek ${amount > 0 ? "forward" : "backward"} by ${Math.abs(
        amount,
      )} seconds`}
      onKeyDown={handleMediaKeys}
      onClick={seekAmount}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

function useSeek(amount: number) {
  const handleSideEffect = useHandleSideEffect();
  return useCallback(() => {
    handleSideEffect({
      type: "SET_TIME_FORWARD",
      value: amount,
    });
  }, [handleSideEffect, amount]);
}
