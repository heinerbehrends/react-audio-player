import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  SetPlaybackRate,
  CurrentIndicator,
  RateDisplay,
} from "../../src/PlaybackRate/SetPlaybackRate";
import * as mediaKeysModule from "../../src/KeyboardControls/handleMediaKeys";
import * as isDisabledModule from "../../src/Shared/useIsDisabled";
import { createPlayerContext } from "../testUtils";
import { renderWithPlayerContext } from "../testComponents";

// Mock useHandleSideEffect hook
const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

let mockAudioElement = {
  playbackRate: 1,
} as unknown as HTMLAudioElement;

vi.mock("../../src/AudioElement/useAudioElement", () => ({
  useAudioElement: () => mockAudioElement,
}));

const defaultContext = createPlayerContext();

describe("SetPlaybackRate", () => {
  const mockHandleKeyDown = vi.fn();
  let mockIsDisabled = false;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(mediaKeysModule, "useHandleMediaKeys").mockReturnValue(
      mockHandleKeyDown,
    );
    vi.spyOn(isDisabledModule, "useIsDisabled").mockImplementation(
      () => mockIsDisabled,
    );
  });

  it("renders a button with correct text", () => {
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    });
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("1.5x");
  });

  it("sets correct aria-label", () => {
    mockAudioElement = {
      playbackRate: 1,
    } as unknown as HTMLAudioElement;
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: <SetPlaybackRate rate={2}>2x</SetPlaybackRate>,
    });
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Set playback rate to 2x");
  });

  it("calls handleSideEffect with correct values when clicked", () => {
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    });
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "SET_PLAYBACK_RATE",
      playbackRate: 1.5,
    });
  });

  it("uses handleMediaKeys for keyboard events", () => {
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    });
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });

    expect(mockHandleKeyDown).toHaveBeenCalled();
  });

  it("is disabled when useIsDisabled returns true", () => {
    mockIsDisabled = true;
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>,
    });
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockHandleSideEffect).not.toHaveBeenCalled();
  });

  it("accepts and applies additional props", () => {
    mockAudioElement = {
      playbackRate: 1,
    } as unknown as HTMLAudioElement;
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: (
        <SetPlaybackRate
          rate={1.5}
          data-testid="custom-button"
          className="custom-class"
        >
          1.5x
        </SetPlaybackRate>
      ),
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveClass("custom-class");
  });
});

describe("CurrentIndicator", () => {
  beforeEach(() => {
    mockAudioElement = {
      playbackRate: 1,
    } as unknown as HTMLAudioElement;
  });

  it("renders children when rate matches current playback rate", () => {
    const contextWithPlaybackRate = createPlayerContext({
      overrides: {
        playbackRate: 1,
      },
    });

    renderWithPlayerContext({
      playerContext: contextWithPlaybackRate,
      component: (
        <CurrentIndicator rate={1}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      ),
    });

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toBeVisible();
    expect(indicator).toHaveTextContent("Current");
  });

  it("hides children when rate doesn't match current playback rate", () => {
    const contextWithPlaybackRate = createPlayerContext({
      overrides: {
        playbackRate: 1,
      },
    });

    renderWithPlayerContext({
      playerContext: contextWithPlaybackRate,
      component: (
        <CurrentIndicator rate={2}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      ),
    });

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toBeVisible();
    expect(indicator.parentElement).toHaveStyle({ visibility: "hidden" });
  });

  it("handles close but not exact rate values", () => {
    const contextWithPlaybackRate = createPlayerContext({
      overrides: {
        playbackRate: 1.001,
      },
    });

    renderWithPlayerContext({
      playerContext: contextWithPlaybackRate,
      component: (
        <CurrentIndicator rate={1}>
          <span data-testid="indicator">Current</span>
        </CurrentIndicator>
      ),
    });

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toBeVisible();
  });
});

describe("RateDisplay", () => {
  it("displays the current playback rate with 'x' suffix", () => {
    const contextWithPlaybackRate = createPlayerContext({
      overrides: {
        playbackRate: 1.5,
      },
    });

    renderWithPlayerContext({
      playerContext: contextWithPlaybackRate,
      component: <RateDisplay />,
    });

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.5x");
  });

  it("rounds the playback rate to 2 decimal places", () => {
    const contextWithPlaybackRate = createPlayerContext({
      overrides: {
        playbackRate: 1.755,
      },
    });

    renderWithPlayerContext({
      playerContext: contextWithPlaybackRate,
      component: <RateDisplay />,
    });

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.76x");
  });

  it("accepts and applies additional props", () => {
    renderWithPlayerContext({
      playerContext: defaultContext,
      component: (
        <RateDisplay data-testid="rate-display" className="custom-display" />
      ),
    });
    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveAttribute("data-testid", "rate-display");
    expect(display).toHaveClass("custom-display");
  });
});
