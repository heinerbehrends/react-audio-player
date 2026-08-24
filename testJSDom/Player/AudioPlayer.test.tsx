import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioPlayer } from "../../src/Player/AudioPlayer";
import type { AudioFile } from "../../src/Player/PlayerConfigContext";
import type { KeyToActionMap } from "../../src/KeyboardControls/handleMediaKeys";

// `audioFiles` and `customKeyboardShortcuts` are static config, so the assertion
// is that they reach `PlayerConfigProvider` — the carrier that survives this
// phase, rather than the reducer provider being retired.
vi.mock("../../src/Player/PlayerConfigContext", () => ({
  PlayerConfigProvider: ({
    children,
    audioFiles,
    customKeyboardShortcuts,
  }: {
    children: React.ReactNode;
    audioFiles: AudioFile[];
    customKeyboardShortcuts?: KeyToActionMap;
  }) => (
    <div
      data-testid="player-config-provider"
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

    expect(screen.getByTestId("player-config-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-element")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("passes audioFiles to PlayerConfigProvider", () => {
    render(
      <AudioPlayer audioFiles={mockAudioFiles}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    const provider = screen.getByTestId("player-config-provider");
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

    const provider = screen.getByTestId("player-config-provider");
    expect(provider).toHaveAttribute("data-audio-files", "0");
  });
});

describe("AudioPlayer - Custom Keyboard Shortcuts", () => {
  const mockAudioFiles = [{ src: "test.mp3" }];

  const mockHandleSideEffect = vi.fn();
  vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
    useHandleSideEffect: () => mockHandleSideEffect,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes custom keyboard shortcuts to PlayerConfigProvider", () => {
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

    const provider = screen.getByTestId("player-config-provider");
    expect(provider).toHaveAttribute(
      "data-keyboard-shortcuts",
      JSON.stringify(customShortcuts),
    );
  });
});
