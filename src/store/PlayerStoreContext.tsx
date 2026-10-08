/* eslint-disable react-refresh/only-export-components --
   The provider and its hook are one unit. Splitting them so this file exports
   only a component would mean exporting the context object, which the
   null-default guard below relies on keeping private. */
import { createContext, useContext, useEffect, useState } from "react";
import { createPlayerStore, type PlayerStore } from "./createPlayerStore";

// No default value: with one, the missing-provider guard below could never
// fire.
const PlayerStoreContext = createContext<PlayerStore | null>(null);
PlayerStoreContext.displayName = "PlayerStoreContext";

type PlayerStoreProviderProps = {
  children: React.ReactNode;
  /**
   * A store to mount against instead of creating one. The jsdom harness passes
   * a store with a fake element attached, so a test can set atoms by driving
   * the fake. Read once, so its identity is as stable as a created store's.
   */
  store?: PlayerStore;
  /** `AudioPlayer`'s `rateRange`. Ignored with `store`, which keeps its own. */
  rateRange?: readonly [number, number] | undefined;
};

/** Render-inert: the store is created once, so the context value never changes. */
export function PlayerStoreProvider({
  children,
  store: injected,
  rateRange,
}: PlayerStoreProviderProps) {
  // Created with the range rather than given it afterwards, so the slider's
  // first render reads the prop and not the default.
  const [store] = useState(() => injected ?? createPlayerStore({ rateRange }));

  // A later change lands an effect after the render. The tuple is usually an
  // inline literal, so this runs on every root render; the store compares the
  // ends by value and does nothing when they have not moved.
  useEffect(() => {
    if (!injected) store.setRateRange(rateRange);
  }, [injected, store, rateRange]);

  return (
    <PlayerStoreContext.Provider value={store}>
      {children}
    </PlayerStoreContext.Provider>
  );
}

export function usePlayerStore(): PlayerStore {
  const store = useContext(PlayerStoreContext);
  if (!store) {
    // Names the public root, not the internal provider.
    throw new Error(
      "This hook or component must be rendered inside an <AudioPlayer>.",
    );
  }
  return store;
}
