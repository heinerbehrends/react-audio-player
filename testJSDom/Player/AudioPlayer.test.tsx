import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioPlayer } from "../../src/Player/AudioPlayer";
import { AudioFile } from "../../src/Player/PlayerProvider";

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
  }: {
    children: React.ReactNode;
    audioFiles: AudioFile[];
  }) => (
    <div
      data-testid="player-context-provider"
      data-audio-files={audioFiles.length}
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
      </AudioPlayer>
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
      </AudioPlayer>
    );

    const provider = screen.getByTestId("player-context-provider");
    expect(provider).toHaveAttribute(
      "data-audio-files",
      mockAudioFiles.length.toString()
    );
  });

  it("renders children in the correct order", () => {
    render(
      <AudioPlayer audioFiles={mockAudioFiles}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AudioPlayer>
    );

    const provider = screen.getByTestId("player-context-provider");
    const children = provider.children;

    expect(children[0]).toHaveAttribute("data-testid", "audio-element");
    expect(children[1]).toHaveAttribute("data-testid", "child-1");
    expect(children[2]).toHaveAttribute("data-testid", "child-2");
  });

  it("handles empty audioFiles array", () => {
    render(
      <AudioPlayer audioFiles={[]}>
        <div>Test Content</div>
      </AudioPlayer>
    );

    const provider = screen.getByTestId("player-context-provider");
    expect(provider).toHaveAttribute("data-audio-files", "0");
  });
});
