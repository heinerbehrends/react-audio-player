import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaybackRate } from "../../src/PlaybackRate/PlaybackRate";
import { createPlayerContext } from "../testUtils";
import { renderWithPlayerContext } from "../testComponents";

// Setup player context for testing
const mockPlayerContext = createPlayerContext();

const mockAudioElement = {
  playbackRate: 1.5,
} as unknown as HTMLAudioElement;

vi.mock("../../src/AudioElement/useAudioElement", () => ({
  useAudioElement: () => mockAudioElement,
}));

describe("PlaybackRate", () => {
  it("should export all subcomponents", () => {
    expect(PlaybackRate.Set).toBeDefined();
    expect(PlaybackRate.Change).toBeDefined();
    expect(PlaybackRate.Current).toBeDefined();
    expect(PlaybackRate.Display).toBeDefined();
  });

  describe("Subcomponents render correctly", () => {
    it("should render PlaybackRate.Set with expected attributes", () => {
      renderWithPlayerContext({
        playerContext: mockPlayerContext,
        component: (
          <PlaybackRate.Set rate={1.5} data-testid="set-button">
            1.5x
          </PlaybackRate.Set>
        ),
      });

      const button = screen.getByTestId("set-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Set playback rate to 1.5x");
      expect(button).toHaveTextContent("1.5x");
    });

    it("should render PlaybackRate.Change with expected attributes", () => {
      renderWithPlayerContext({
        playerContext: mockPlayerContext,
        component: (
          <PlaybackRate.Change amount={0.25} data-testid="change-button">
            Faster
          </PlaybackRate.Change>
        ),
      });

      const button = screen.getByTestId("change-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Faster");
    });

    it("should render PlaybackRate.Current with current rate", () => {
      renderWithPlayerContext({
        playerContext: mockPlayerContext,
        component: <PlaybackRate.Current rate={1.5}>*</PlaybackRate.Current>,
      });

      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  it("should support composition of components", () => {
    renderWithPlayerContext({
      playerContext: mockPlayerContext,
      component: (
        <PlaybackRate>
          <PlaybackRate.Set rate={2.0} data-testid="set-button">
            2.0x
          </PlaybackRate.Set>
          <PlaybackRate.Display />
        </PlaybackRate>
      ),
    });

    const button = screen.getByLabelText("Set playback rate to 2x");
    expect(button).toBeInTheDocument();
    expect(screen.getByText("1.5x")).toBeInTheDocument();
    expect(screen.getByText("2.0x")).toBeInTheDocument();
  });

  it("should render a container with proper accessibility attributes", () => {
    render(
      <PlaybackRate>
        <div data-testid="playback-rate-child">Content</div>
      </PlaybackRate>,
    );

    // Check that the container is rendered with the correct content
    expect(screen.getByTestId("playback-rate-child")).toBeInTheDocument();

    // Check for proper accessibility attributes
    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "Playback rate options");

    // Verify children are rendered inside the container
    expect(container).toContainElement(
      screen.getByTestId("playback-rate-child"),
    );
  });
});
