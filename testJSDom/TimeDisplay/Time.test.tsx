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
import { TestProviders } from "../testComponents";
import { formatTime } from "../../src/Shared/sharedFunctions";

const mockAudioElement = {
  currentTime: 65,
  duration: 120,
} as unknown as HTMLAudioElement;

vi.mock("../../src/AudioElement/useAudioElement", () => ({
  useAudioElement: () => mockAudioElement,
}));

const createWrapper =
  (context: PlayerContextType) =>
  ({ children }: { children: React.ReactNode }) => (
    <TestProviders>
      <PlayerContext.Provider value={context}>
        {children}
      </PlayerContext.Provider>
    </TestProviders>
  );

describe("Time", () => {
  const defaultContext = createPlayerContext();
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
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(120)).toBe("2:00");
    expect(formatTime(121)).toBe("2:01");
  });
});
