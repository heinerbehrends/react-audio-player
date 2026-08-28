import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { AudioPlayer } from "../../src/Player/AudioPlayer";
import type { AudioFile } from "../../src/Player/PlayerConfigContext";
import type { KeyToActionMap } from "../../src/KeyboardControls/handleMediaKeys";

// `audioFile` and `customKeyboardShortcuts` are static config, so the assertion
// is that they reach `PlayerConfigProvider`. `onEnded` is not config — it is a
// callback bound straight to the element — so it is asserted on `AudioElement`.
vi.mock("../../src/Player/PlayerConfigContext", () => ({
  PlayerConfigProvider: ({
    children,
    audioFile,
    customKeyboardShortcuts,
  }: {
    children: React.ReactNode;
    audioFile: AudioFile;
    customKeyboardShortcuts?: KeyToActionMap;
  }) => (
    <div
      data-testid="player-config-provider"
      data-audio-src={audioFile.src}
      data-keyboard-shortcuts={JSON.stringify(customKeyboardShortcuts)}
    >
      {children}
    </div>
  ),
}));

vi.mock("../../src/AudioElement/AudioElement", () => ({
  AudioElement: ({ onEnded }: { onEnded?: () => void }) => (
    <button data-testid="audio-element" onClick={onEnded} />
  ),
}));

describe("AudioPlayer", () => {
  const mockAudioFile = { src: "test1.mp3" };

  it("renders all required components", () => {
    render(
      <AudioPlayer audioFile={mockAudioFile}>
        <div data-testid="child-content">Test Content</div>
      </AudioPlayer>,
    );

    expect(screen.getByTestId("player-config-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-element")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("passes audioFile to PlayerConfigProvider", () => {
    render(
      <AudioPlayer audioFile={mockAudioFile}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    expect(screen.getByTestId("player-config-provider")).toHaveAttribute(
      "data-audio-src",
      "test1.mp3",
    );
  });

  /**
   * The playlist contract: `onEnded` has to reach the element, since that is the
   * only place the `ended` event exists. A consumer swapping `audioFile` from
   * this callback is the supported way to build a playlist.
   */
  it("passes onEnded through to the element", () => {
    const onEnded = vi.fn();
    render(
      <AudioPlayer audioFile={mockAudioFile} onEnded={onEnded}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    screen.getByTestId("audio-element").click();

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("advances a consumer-held playlist across renders", () => {
    function Playlist() {
      const tracks = [{ src: "one.mp3" }, { src: "two.mp3" }];
      const [index, setIndex] = useState(0);
      return (
        <AudioPlayer
          audioFile={tracks[index]!}
          onEnded={() => setIndex((i) => i + 1)}
        >
          <div>Test Content</div>
        </AudioPlayer>
      );
    }

    render(<Playlist />);
    expect(screen.getByTestId("player-config-provider")).toHaveAttribute(
      "data-audio-src",
      "one.mp3",
    );

    act(() => screen.getByTestId("audio-element").click());

    expect(screen.getByTestId("player-config-provider")).toHaveAttribute(
      "data-audio-src",
      "two.mp3",
    );
  });
});

describe("AudioPlayer - Custom Keyboard Shortcuts", () => {
  const mockAudioFile = { src: "test.mp3" };

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
        audioFile={mockAudioFile}
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
