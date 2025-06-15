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

  const renderWithContext = (playbackRate = 1, rate = 1.5) => {
    const playerContext = {
      ...defaultContext,
      playbackRate,
    };

    return renderWithPlayerContext({
      playerContext,
      component: <SetPlaybackRate rate={rate}>{rate}x</SetPlaybackRate>,
    });
  };

  it("renders a button with correct text", () => {
    renderWithContext();
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("1.5x");
  });

  it("sets correct aria-label", () => {
    renderWithContext(1, 2);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Set playback rate to 2x");
  });

  it("calls handleSideEffect with correct values when clicked", () => {
    renderWithContext();
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "SET_PLAYBACK_RATE",
      playbackRate: 1.5,
    });
  });

  it("uses handleMediaKeys for keyboard events", () => {
    renderWithContext();
    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "p" });

    expect(mockHandleKeyDown).toHaveBeenCalled();
  });

  it("is disabled when useIsDisabled returns true", () => {
    mockIsDisabled = true;
    renderWithContext();
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockHandleSideEffect).not.toHaveBeenCalled();
  });

  it("accepts and applies additional props", () => {
    renderWithPlayerContext({
      playerContext: {
        ...defaultContext,
        playbackRate: 1,
      },
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
  const testContext = {
    ...defaultContext,
  };

  it("renders children when rate matches current playback rate", () => {
    renderWithPlayerContext({
      playerContext: testContext,
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
    renderWithPlayerContext({
      playerContext: testContext,
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
    renderWithPlayerContext({
      playerContext: {
        ...testContext,
        playbackRate: 1.001, // Very close to 1
      },
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
    renderWithPlayerContext({
      playerContext: {
        ...defaultContext,
        playbackRate: 1.5,
      },
      component: <RateDisplay />,
    });

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.5x");
  });

  it("rounds the playback rate to 2 decimal places", () => {
    renderWithPlayerContext({
      playerContext: {
        ...defaultContext,
        playbackRate: 1.755,
      },
      component: <RateDisplay />,
    });

    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveTextContent("1.76x");
  });

  it("accepts and applies additional props", () => {
    renderWithPlayerContext({
      playerContext: {
        ...defaultContext,
        playbackRate: 1.755,
      },
      component: (
        <RateDisplay data-testid="rate-display" className="custom-display" />
      ),
    });
    const display = screen.getByLabelText("Current playback rate");
    expect(display).toHaveAttribute("data-testid", "rate-display");
    expect(display).toHaveClass("custom-display");
  });
});
