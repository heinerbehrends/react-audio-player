import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaybackRate } from "../../src/PlaybackRate/PlaybackRate";
import { TestProviders } from "../testComponents";

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
      render(
        <TestProviders>
          (
          <PlaybackRate.Set rate={1.5} data-testid="set-button">
            1.5x
          </PlaybackRate.Set>
          )
        </TestProviders>,
      );

      const button = screen.getByTestId("set-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Set playback rate to 1.5x");
      expect(button).toHaveTextContent("1.5x");
    });

    it("should render PlaybackRate.Change with expected attributes", () => {
      render(
        <TestProviders>
          (
          <PlaybackRate.Change amount={0.25} data-testid="change-button">
            Faster
          </PlaybackRate.Change>
          )
        </TestProviders>,
      );

      const button = screen.getByTestId("change-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Faster");
    });

    it("should render PlaybackRate.Current with current rate", () => {
      render(
        <TestProviders>
          <PlaybackRate.Current rate={1.5}>*</PlaybackRate.Current>
        </TestProviders>,
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  it("should support composition of components", () => {
    render(
      <TestProviders>
        (
        <PlaybackRate>
          <PlaybackRate.Set rate={2.0} data-testid="set-button">
            2.0x
          </PlaybackRate.Set>
          <PlaybackRate.Set rate={1.5} data-testid="set-button">
            1.5x
          </PlaybackRate.Set>
          <PlaybackRate.Display />
        </PlaybackRate>
        )
      </TestProviders>,
    );

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

    expect(screen.getByTestId("playback-rate-child")).toBeInTheDocument();

    const container = screen.getByRole("group");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-label", "Playback rate options");

    expect(container).toContainElement(
      screen.getByTestId("playback-rate-child"),
    );
  });
});
