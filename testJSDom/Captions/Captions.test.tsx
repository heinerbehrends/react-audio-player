import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Captions } from "../../src/Captions/Captions";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";

// Mock ToggleCaptions
vi.mock("../../src/Captions/ToggleCaptions", () => ({
  ToggleCaptions: () => <button data-testid="toggle-captions">Toggle</button>,
}));

describe("Captions", () => {
  const mockCue1 = { text: "Hello world" };
  const mockCue2 = { text: "This is a test" };
  const defaultContext = {
    cues: [mockCue1, mockCue2] as VTTCue[],
    showCaptions: true,
    // Other required context values
    handlePlayerAction: vi.fn(),
    playerState: "paused" as const,
    isMuted: false,
    audioFiles: [],
    getPlayerState: vi.fn(),
    playbackRate: 1,
    volumeState: "high" as const,
    unmuteVolumeRef: { current: 0.5 },
    timeDisplay: "elapsed" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders caption text when showCaptions is true", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <Captions />
      </PlayerContext.Provider>
    );

    const captionsSection = screen.getByRole("region", { name: /captions/i });
    expect(captionsSection).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("This is a test")).toBeInTheDocument();
  });

  it("does not render captions when showCaptions is false", () => {
    const contextWithoutCaptions = {
      ...defaultContext,
      showCaptions: false,
    };

    render(
      <PlayerContext.Provider value={contextWithoutCaptions}>
        <Captions />
      </PlayerContext.Provider>
    );

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });

  it("renders with proper accessibility attributes", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <Captions />
      </PlayerContext.Provider>
    );

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toHaveAttribute("aria-label", "Captions");
    expect(captionsSection).toHaveAttribute("aria-live", "polite");
    expect(captionsSection).toHaveAttribute("aria-atomic", "false");
    expect(captionsSection).toHaveAttribute("aria-relevant", "additions");
    expect(captionsSection).toHaveAttribute("tabIndex", "0");
  });

  it("passes additional props to the section element", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <Captions className="custom-class" data-testid="captions" />
      </PlayerContext.Provider>
    );

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toHaveClass("custom-class");
    expect(captionsSection).toHaveAttribute("data-testid", "captions");
  });

  it("renders empty section when there are no cues", () => {
    const contextWithoutCues = {
      ...defaultContext,
      cues: [],
    };

    render(
      <PlayerContext.Provider value={contextWithoutCues}>
        <Captions />
      </PlayerContext.Provider>
    );

    const captionsSection = screen.getByRole("region");
    expect(captionsSection).toBeInTheDocument();
    expect(captionsSection.children.length).toBe(0);
  });

  it("exports Toggle component", () => {
    expect(Captions.Toggle).toBeDefined();

    render(<Captions.Toggle />);
    expect(screen.getByTestId("toggle-captions")).toBeInTheDocument();
  });

  it("renders with children", () => {
    render(
      <PlayerContext.Provider value={defaultContext}>
        <Captions>
          <div data-testid="custom-child">Custom Child</div>
        </Captions>
      </PlayerContext.Provider>
    );

    // Should still render captions text
    expect(screen.getByText("Hello world")).toBeInTheDocument();

    // But children aren't rendered because they're not used in the component
    expect(screen.queryByTestId("custom-child")).not.toBeInTheDocument();
  });
});

describe("Captions.Toggle", () => {
  it("renders the ToggleCaptions component", () => {
    render(<Captions.Toggle />);
    expect(screen.getByTestId("toggle-captions")).toBeInTheDocument();
  });
});
