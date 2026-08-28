/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit: splitting them so this file exports
   only a component would mean exporting the context object itself, which is the
   handle the null-default guard below exists to keep private. */
import { createContext, useContext, useState } from "react";
import { createPlayerStore, type PlayerStore } from "./createPlayerStore";

// No default value, deliberately: a default is why an `if (!context)` guard can
// never fire. A missing provider has to be loud.
const PlayerStoreContext = createContext<PlayerStore | null>(null);
PlayerStoreContext.displayName = "PlayerStoreContext";

type PlayerStoreProviderProps = {
  children: React.ReactNode;
  /**
   * A store to mount against instead of creating one. The jsdom harness passes a
   * store with a fake element attached, so a test can set atoms by driving the
   * fake rather than mocking jsdom audio. Read once, so its identity is as stable
   * as a created store's.
   */
  store?: PlayerStore;
};

/** Render-inert: the store is created once, so the context value never changes. */
export function PlayerStoreProvider({
  children,
  store: injected,
}: PlayerStoreProviderProps) {
  const [store] = useState(() => injected ?? createPlayerStore());

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
