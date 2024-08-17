import { useState } from "react";
import { AudioPlayerContext } from "./AudioPlayerContext";

export function SetLoopRegionButton() {
  const [buttonState, setButtonState] = useState<
    "setStart" | "setEnd" | "reset"
  >("setStart");
  console.log("buttonState", buttonState);
  const send = AudioPlayerContext.useActorRef().send;
  if (buttonState === "setStart") {
    return (
      <button
        onClick={() => {
          setButtonState("setEnd");
          send({ type: "SET_LOOP_START" });
        }}
      >
        Set Loop Start
      </button>
    );
  }
  if (buttonState === "setEnd") {
    return (
      <button
        onClick={() => {
          setButtonState("reset");
          send({ type: "SET_LOOP_END" });
        }}
      >
        Set Loop End
      </button>
    );
  }
  return (
    <button
      onClick={() => {
        setButtonState("setStart");
        send({ type: "RESET_LOOP" });
      }}
    >
      Reset Loop
    </button>
  );
}
