import { describe, it, expect, vi } from "vitest";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import "@testing-library/jest-dom";
import { createPlayerContext } from "../testUtils";

const createWrapper =
  (context: PlayerContextType) =>
  ({ children }: { children: React.ReactNode }) => (
    <PlayerContext.Provider value={context}>{children}</PlayerContext.Provider>
  );

describe("Time", () => {
  const defaultContext = createPlayerContext({
    overrides: {
      handlePlayerAction: vi.fn(),
      playerState: "playing",
      timeDisplay: "elapsed",
    },
    getPlayerStateOverrides: () => ({
      duration: 65,
      currentTime: 45,
    }),
  });
  it("hides when showing remaining time", () => {
    const context = { ...defaultContext, timeDisplay: "remaining" as const };
    render(<Time.Elapsed />, { wrapper: createWrapper(context) });
    expect(screen.queryByLabelText("elapsed")).not.toBeInTheDocument();
  });

  it("has correct aria attributes", () => {
    const context = { ...defaultContext, timeDisplay: "remaining" as const };
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
    const mockAudioElement = {
      duration: 65,
      currentTime: 45,
      volume: 0.5,
      playbackRate: 1.5,
    } as HTMLAudioElement;

    const context = createPlayerContext({
      overrides: {
        playerState: "playing",
        timeDisplay: "elapsed",
        getPlayerState: () => ({
          duration: mockAudioElement.duration,
          currentTime: mockAudioElement.currentTime,
          volume: mockAudioElement.volume,
          playbackRate: mockAudioElement.playbackRate,
          volumeState: "high",
        }),
      },
    });
    render(<Time.Duration />, { wrapper: createWrapper(context) });
    expect(screen.getByLabelText("duration")).toHaveTextContent("1:05");
  });
});
