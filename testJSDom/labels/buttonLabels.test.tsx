import { describe, it, expect } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlayButton } from "../../src/Player/PlayButton";
import { MuteButton } from "../../src/Player/MuteButton";
import { SeekButton } from "../../src/Player/SeekButton";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { createTestStore } from "../store/createTestStore";
import { renderWithStore } from "../store/renderWithStore";
import type { PlayerLabels } from "../../src/Shared/playerLabels";
import type { TimeDisplayState } from "../../src/store/createPlayerStore";
import type { MediaFields } from "../store/mediaElementFake";
import "@testing-library/jest-dom";

/** The four player states are element states, so each row sets up an element. */
const playerStates: Record<string, Partial<MediaFields>> = {
  paused: { readyState: 1, paused: true },
  playing: { readyState: 1, paused: false },
  loading: { readyState: 0 },
  error: { readyState: 0, error: {} as MediaError },
};

/** Muted wins whatever the volume; 0.5 is the low/high boundary. */
const volumeStates: Record<string, Partial<MediaFields>> = {
  muted: { readyState: 1, volume: 0.8, muted: true },
  low: { readyState: 1, volume: 0.4, muted: false },
  high: { readyState: 1, volume: 0.8, muted: false },
};

/** `timeDisplay` is the one writable atom, so a test sets it before rendering. */
function withTimeDisplay(timeDisplay: TimeDisplayState) {
  const harness = createTestStore({ readyState: 1, duration: 120 });
  harness.store.timeDisplay.set(timeDisplay);
  return harness;
}

const play: NonNullable<PlayerLabels["play"]> = {
  playing: "Audio pausieren",
  paused: "Audio abspielen",
  loading: "Audio wird geladen",
  error: "Fehler beim Laden des Audios",
};

const mute: NonNullable<PlayerLabels["mute"]> = {
  // The state says what is, the name says what pressing does — so the muted
  // player is the one named "switch the sound on".
  muted: "Ton einschalten",
  low: "Ton ausschalten",
  high: "Ton ausschalten",
};

const timeToggle: NonNullable<PlayerLabels["timeToggle"]> = {
  elapsed: "Restzeit anzeigen",
  remaining: "Verstrichene Zeit anzeigen",
};

describe("labels.play", () => {
  // Every state, not just `paused`: a design that flattened the four into one
  // string would pass a single-row test (A4).
  it.each([
    ["paused", "Audio abspielen"],
    ["playing", "Audio pausieren"],
    ["loading", "Audio wird geladen"],
    ["error", "Fehler beim Laden des Audios"],
  ])("names the button in the %s state", (state, name) => {
    renderWithStore(<PlayButton>Play</PlayButton>, {
      element: playerStates[state]!,
      labels: { play },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  it("falls back to English with no entry", () => {
    renderWithStore(<PlayButton>Play</PlayButton>, {
      element: playerStates["paused"]!,
    });

    expect(screen.getByRole("button")).toHaveAccessibleName("Play audio");
  });

  it("loses to a per-instance aria-label", () => {
    renderWithStore(<PlayButton aria-label="Abspielen">Play</PlayButton>, {
      element: playerStates["paused"]!,
      labels: { play },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName("Abspielen");
  });
});

describe("labels.mute", () => {
  // Three states, two names: `low` and `high` both mean audible, so pressing
  // mutes.
  it.each([
    ["muted", "Ton einschalten"],
    ["low", "Ton ausschalten"],
    ["high", "Ton ausschalten"],
  ])("names the button in the %s state", (state, name) => {
    renderWithStore(<MuteButton>Mute</MuteButton>, {
      element: volumeStates[state]!,
      labels: { mute },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  it("falls back to English with no entry", () => {
    renderWithStore(<MuteButton>Mute</MuteButton>, {
      element: volumeStates["high"]!,
    });

    expect(screen.getByRole("button")).toHaveAccessibleName("Mute");
  });
});

describe("labels.timeToggle", () => {
  it.each([
    ["elapsed", "Restzeit anzeigen"],
    ["remaining", "Verstrichene Zeit anzeigen"],
  ])("names the toggle while showing %s", (shown, name) => {
    renderWithStore(<Time.Toggle>Toggle</Time.Toggle>, {
      testStore: withTimeDisplay(shown as TimeDisplayState),
      labels: { timeToggle },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  it("falls back to English with no entry", () => {
    renderWithStore(<Time.Toggle>Toggle</Time.Toggle>, {
      testStore: withTimeDisplay("elapsed"),
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Show time remaining",
    );
  });
});

describe("labels.seek", () => {
  // The entry gets the signed amount and puts the verb where German wants it,
  // which is the thing no `${direction}` slot in an English sentence can do.
  const seek: NonNullable<PlayerLabels["seek"]> = ({ amount }) =>
    `${Math.abs(amount)} Sekunden ${amount > 0 ? "vorspulen" : "zurückspulen"}`;

  it.each([
    [10, "10 Sekunden vorspulen"],
    [-10, "10 Sekunden zurückspulen"],
  ])("receives the signed amount %i", (amount, name) => {
    renderWithStore(<SeekButton amount={amount}>Seek</SeekButton>, {
      labels: { seek },
    });

    expect(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  it("falls back to English with no entry", () => {
    renderWithStore(<SeekButton amount={-10}>Seek</SeekButton>);

    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Seek backward by 10 seconds",
    );
  });
});

/**
 * Partial override: naming one control leaves the others English.
 *
 * This pins the **behaviour**, not the design that produces it — a shared
 * defaults table merged as `{...defaults, ...labels}` renders identically, so
 * this test would not notice one. The structural property it protects (each
 * component holding its own literal, so a `PlayButton` bundle carries no slider
 * strings) has no automated guard; it is a manual bundle measurement, recorded
 * in A15's resolution.
 */
it("leaves the entries a partial bag does not name in English", () => {
  renderWithStore(
    <>
      <PlayButton>Play</PlayButton>
      <MuteButton>Mute</MuteButton>
    </>,
    {
      element: { readyState: 1, paused: true, volume: 0.8 },
      labels: { play },
    },
  );

  const [playButton, muteButton] = screen.getAllByRole("button");
  expect(playButton).toHaveAccessibleName("Audio abspielen");
  expect(muteButton).toHaveAccessibleName("Mute");
});

/**
 * How a locale switch works: `labels` is read during render and every control
 * subscribes to `PlayerConfigContext`, so a new object re-renders all of them
 * where they stand — no remount, and nothing to memoise around.
 */
it("re-renders the controls when labels is swapped at runtime", () => {
  function LocaleSwitcher() {
    const [harness] = useState(() => createTestStore({ readyState: 1 }));
    const [labels, setLabels] = useState<PlayerLabels | undefined>(undefined);

    return (
      <PlayerStoreProvider store={harness.store}>
        <PlayerConfigProvider
          audioFile={{ src: "test-audio.mp3" }}
          customKeyboardShortcuts={undefined}
          labels={labels}
        >
          <PlayButton>Play</PlayButton>
        </PlayerConfigProvider>
        <button onClick={() => setLabels({ play })}>Auf Deutsch</button>
      </PlayerStoreProvider>
    );
  }

  render(<LocaleSwitcher />);
  expect(screen.getByRole("button", { name: "Play audio" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Auf Deutsch" }));

  expect(screen.getByRole("button", { name: "Audio abspielen" })).toBeVisible();
});
