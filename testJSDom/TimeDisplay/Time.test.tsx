import { describe, it, expect, vi } from "vitest";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import "@testing-library/jest-dom";

function createPlayerContext(overrides = {}): PlayerContextType {
  return {
    handlePlayerAction: vi.fn(),
    playerState: "playing",
    showCaptions: false,
    isMuted: false,
    playbackRate: 1.5,
    volumeState: "high",
    unmuteVolumeRef: { current: 0.5 },
    timeDisplay: "elapsed",
    audioFiles: [{ src: "test-audio.mp3" }],
    cues: [],
    getPlayerState: () => ({
      duration: 65,
      currentTime: 45,
      volume: 0.5,
      playbackRate: 1.5,
      volumeState: "high",
      unmuteVolumeRef: { current: 0.5 },
      // ... other state
    }),
    ...overrides,
  };
}

const createWrapper =
  (context: PlayerContextType) =>
  ({ children }) => (
    <PlayerContext.Provider value={context}>{children}</PlayerContext.Provider>
  );

describe("Time", () => {
  it("hides when showing remaining time", () => {
    const context = createPlayerContext({ timeDisplay: "remaining" });
    render(<Time.Elapsed />, { wrapper: createWrapper(context) });
    expect(screen.queryByLabelText("elapsed")).not.toBeInTheDocument();
  });

  it("has correct aria attributes", () => {
    const context = createPlayerContext({ timeDisplay: "remaining" });
    render(<Time.Toggle>Toggle</Time.Toggle>, {
      wrapper: createWrapper(context),
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      "Toggle elapsed and remaining time",
    );
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("formats time correctly", () => {
    const context = createPlayerContext({
      getPlayerState: () => ({
        duration: 65,
        currentTime: 45,
        // ... other state
      }),
    });
    render(<Time.Duration />, { wrapper: createWrapper(context) });
    expect(screen.getByLabelText("duration")).toHaveTextContent("1:05");
  });
});
