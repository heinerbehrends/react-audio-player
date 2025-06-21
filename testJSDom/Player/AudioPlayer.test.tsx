import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioPlayer } from "../../src/Player/AudioPlayer";
import type { AudioFile } from "../../src/Player/PlayerProvider";
import type { KeyToActionMap } from "../../src/KeyboardControls/handleMediaKeys";

// Mock the child components
vi.mock("../../src/AudioElement/AudioContextProvider", () => ({
  AudioContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="audio-context-provider">{children}</div>
  ),
}));

vi.mock("../../src/Player/PlayerProvider", () => ({
  PlayerContextProvider: ({
    children,
    audioFiles,
    customKeyboardShortcuts,
  }: {
    children: React.ReactNode;
    audioFiles: AudioFile[];
    customKeyboardShortcuts?: KeyToActionMap;
  }) => (
    <div
      data-testid="player-context-provider"
      data-audio-files={audioFiles.length}
      data-keyboard-shortcuts={JSON.stringify(customKeyboardShortcuts)}
    >
      {children}
    </div>
  ),
}));

vi.mock("../../src/AudioElement/AudioElement", () => ({
  AudioElement: () => <div data-testid="audio-element" />,
}));

describe("AudioPlayer", () => {
  const mockAudioFiles = [
    { id: "1", src: "test1.mp3", title: "Test 1" },
    { id: "2", src: "test2.mp3", title: "Test 2" },
  ];

  it("renders all required components", () => {
    render(
      <AudioPlayer audioFiles={mockAudioFiles}>
        <div data-testid="child-content">Test Content</div>
      </AudioPlayer>,
    );

    expect(screen.getByTestId("audio-context-provider")).toBeInTheDocument();
    expect(screen.getByTestId("player-context-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-element")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("passes audioFiles to PlayerContextProvider", () => {
    render(
      <AudioPlayer audioFiles={mockAudioFiles}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    const provider = screen.getByTestId("player-context-provider");
    expect(provider).toHaveAttribute(
      "data-audio-files",
      mockAudioFiles.length.toString(),
    );
  });

  it("handles empty audioFiles array", () => {
    render(
      <AudioPlayer audioFiles={[]}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    const provider = screen.getByTestId("player-context-provider");
    expect(provider).toHaveAttribute("data-audio-files", "0");
  });
});

describe("AudioPlayer - Custom Keyboard Shortcuts", () => {
  const mockAudioFiles = [{ src: "test.mp3" }];

  // Mock the useHandleSideEffect hook
  const mockHandleSideEffect = vi.fn();
  vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
    useHandleSideEffect: () => mockHandleSideEffect,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes custom keyboard shortcuts to PlayerContextProvider", () => {
    const customShortcuts: KeyToActionMap = {
      x: { type: "TOGGLE_PLAY" },
      y: { type: "STOP_AUDIO" },
    };

    render(
      <AudioPlayer
        audioFiles={mockAudioFiles}
        customKeyboardShortcuts={customShortcuts}
      >
        <div>Test Content</div>
      </AudioPlayer>,
    );

    const provider = screen.getByTestId("player-context-provider");
    expect(provider).toHaveAttribute(
      "data-keyboard-shortcuts",
      JSON.stringify(customShortcuts),
    );
  });
});
