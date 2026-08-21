/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit: splitting them so this file exports
   only a component would mean exporting the context object itself, which is the
   handle the null-default guard below exists to keep private. */
import { createContext, useContext, useState } from "react";
import { createPlayerStore, type PlayerStore } from "./createPlayerStore";

// No default value, deliberately: `AudioContext` has one, which is why its
// `if (!context)` guard can never fire and why the duplicate-context bug was
// silent. A missing provider has to be loud.
const PlayerStoreContext = createContext<PlayerStore | null>(null);
PlayerStoreContext.displayName = "PlayerStoreContext";

type PlayerStoreProviderProps = {
  children: React.ReactNode;
};

/**
 * Render-inert: the store is created once, so the context value never changes.
 * It goes outermost in `AudioPlayer` so the providers inside it can be deleted
 * without moving it.
 */
export function PlayerStoreProvider({ children }: PlayerStoreProviderProps) {
  const [store] = useState(() => createPlayerStore());

  return (
    <PlayerStoreContext.Provider value={store}>
      {children}
    </PlayerStoreContext.Provider>
  );
}

export function usePlayerStore(): PlayerStore {
  const store = useContext(PlayerStoreContext);
  if (!store) {
    throw new Error("usePlayerStore must be used within a PlayerStoreProvider");
  }
  return store;
}
