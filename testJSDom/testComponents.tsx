import { act, render } from "@testing-library/react";
import { useState } from "react";
import { PlayerStoreProvider } from "../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../src/Player/PlayerConfigContext";
import type { KeyToActionMap } from "../src/KeyboardControls/handleMediaKeys";
import type { AudioFile } from "../src/Player/PlayerConfigContext";
import { createTestStore, type TestStore } from "./store/createTestStore";
import type { MediaFields } from "./store/mediaElementFake";

type TestProvidersProps = {
  children: React.ReactNode;
  audioFiles?: AudioFile[] | undefined;
  customKeyboardShortcuts?: KeyToActionMap | undefined;
  /** An existing harness, when the test needs the store it renders against. */
  testStore?: TestStore | undefined;
  /** Otherwise: the fields the attached fake is primed from. */
  element?: Partial<MediaFields> | undefined;
};

/**
 * The two providers `AudioPlayer` renders above the tree, minus the `<audio>`
 * tag. The store comes with a fake attached at `readyState: 1`, so the default is
 * a loaded, paused player.
 */
export function TestProviders({
  children,
  audioFiles = [],
  customKeyboardShortcuts,
  testStore,
  element,
}: TestProvidersProps) {
  const [harness] = useState(
    () => testStore ?? createTestStore({ readyState: 1, ...element }),
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

type RenderInPlayerOptions = Omit<TestProvidersProps, "children">;

/**
 * Renders a component under the store and the config, and hands back the harness
 * so a test can drive the fake element and read it afterwards.
 */
export function renderInPlayer(
  ui: React.ReactNode,
  options: RenderInPlayerOptions = {},
) {
  const harness =
    options.testStore ??
    createTestStore({ readyState: 1, ...(options.element ?? {}) });

  const result = render(
    <TestProviders {...options} testStore={harness}>
      {ui}
    </TestProviders>,
  );

  return {
    ...result,
    ...harness,
    /** Emits a media event on the fake inside `act`, so React flushes. */
    emit: (event: string) => act(() => harness.element.emit(event)),
    /**
     * Re-renders inside the same providers, against the same store — testing
     * library's own `rerender` would drop the wrapper and remount everything.
     */
    rerender: (next: React.ReactNode) =>
      result.rerender(
        <TestProviders {...options} testStore={harness}>
          {next}
        </TestProviders>,
      ),
  };
}
