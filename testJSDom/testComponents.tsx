import { render } from "@testing-library/react";
import { useState } from "react";
import {
  AudioContext,
  AudioContextType,
} from "../src/AudioElement/AudioContext";
import { PlayerStoreProvider } from "../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../src/Player/PlayerConfigContext";
import type { KeyToActionMap } from "../src/KeyboardControls/handleMediaKeys";
import type { AudioFile } from "../src/Player/PlayerConfigContext";
import { createTestStore } from "./store/createTestStore";
import type { MediaFields } from "./store/mediaElementFake";

type TestProvidersProps = {
  children: React.ReactNode;
  audioFiles?: AudioFile[] | undefined;
  customKeyboardShortcuts?: KeyToActionMap | undefined;
  /** Fields the attached fake is primed from. */
  element?: Partial<MediaFields>;
};

/**
 * The store and the static config — the two providers `AudioPlayer` renders
 * above the tree, minus the `<audio>` tag.
 *
 * The store comes with a fake attached at `readyState: 1`, so the default is a
 * loaded, paused player. `renderWithStore` is the richer entry point: use this
 * one when the test drives a legacy slider context and only needs the providers
 * to exist.
 */
export function TestProviders({
  children,
  audioFiles = [],
  customKeyboardShortcuts,
  element,
}: TestProvidersProps) {
  const [harness] = useState(() =>
    createTestStore({ readyState: 1, ...element }),
  );

  return (
    <PlayerStoreProvider store={harness.store}>
      <PlayerConfigProvider
        audioFiles={audioFiles}
        customKeyboardShortcuts={customKeyboardShortcuts}
      >
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}

type CreateContextWrapperArgs = {
  audioContext: AudioContextType;
  audioFiles?: AudioFile[] | undefined;
};

export function createContextWrapper({
  audioContext,
  audioFiles,
}: CreateContextWrapperArgs): React.FC<{ children: React.ReactNode }> {
  return ({ children }: { children: React.ReactNode }) => (
    <TestProviders audioFiles={audioFiles}>
      <AudioContext.Provider value={audioContext}>
        {children}
      </AudioContext.Provider>
    </TestProviders>
  );
}

export function renderWithContexts({
  audioContext,
  component,
  audioFiles,
}: {
  audioContext: AudioContextType;
  component: React.ReactNode;
  audioFiles?: AudioFile[] | undefined;
}) {
  return render(
    <TestProviders audioFiles={audioFiles}>
      <AudioContext.Provider value={audioContext}>
        {component}
      </AudioContext.Provider>
    </TestProviders>,
  );
}

export function renderWithAudioContext({
  audioContext,
  component,
}: {
  audioContext: AudioContextType;
  component: React.ReactNode;
}) {
  return renderWithContexts({ audioContext, component });
}
