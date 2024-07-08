import { ReactNode } from "react";
import { audioPlayerMachine } from "../logic/audioPlayerMachine";
import { createActorContext } from "@xstate/react";

export const AudioPlayerContext = createActorContext(audioPlayerMachine);

export function ActorContextProvider({ children }: { children: ReactNode }) {
  return <AudioPlayerContext.Provider>{children}</AudioPlayerContext.Provider>;
}
