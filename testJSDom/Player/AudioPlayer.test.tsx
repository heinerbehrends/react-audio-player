import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { AudioPlayer } from "../../src/Player/AudioPlayer";
import type { Track } from "../../src/Player/PlayerConfigContext";
import type { Shortcuts } from "../../src/KeyboardControls/handleMediaKeys";
import type { PlayerLabels } from "../../src/Shared/playerLabels";

// `track`, `shortcuts` and `labels` are static config, so the
// assertion is that they reach `PlayerConfigProvider`. `onEnded` is not config —
// it is a callback bound straight to the element — so it is asserted on
// `AudioElement`.
vi.mock("../../src/Player/PlayerConfigContext", () => ({
  PlayerConfigProvider: ({
    children,
    track,
    shortcuts,
    labels,
  }: {
    children: React.ReactNode;
    track: Track;
    shortcuts?: Shortcuts;
    labels?: PlayerLabels;
  }) => (
    <div
      data-testid="player-config-provider"
      data-audio-src={track.src}
      // The keys, not the bags: the entries are functions, which
      // `JSON.stringify` drops.
      data-shortcut-keys={Object.keys(shortcuts ?? {}).join(",")}
      data-label-keys={Object.keys(labels ?? {}).join(",")}
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
  const mockTrack = { src: "test1.mp3" };

  it("renders all required components", () => {
    render(
      <AudioPlayer track={mockTrack}>
        <div data-testid="child-content">Test Content</div>
      </AudioPlayer>,
    );

    expect(screen.getByTestId("player-config-provider")).toBeInTheDocument();
    expect(screen.getByTestId("audio-element")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("passes track to PlayerConfigProvider", () => {
    render(
      <AudioPlayer track={mockTrack}>
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
   * only place the `ended` event exists. A consumer swapping `track` from
   * this callback is the supported way to build a playlist.
   */
  it("passes onEnded through to the element", () => {
    const onEnded = vi.fn();
    render(
      <AudioPlayer track={mockTrack} onEnded={onEnded}>
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
          track={tracks[index]!}
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
  const mockTrack = { src: "test.mp3" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes custom keyboard shortcuts to PlayerConfigProvider", () => {
    const customShortcuts: Shortcuts = {
      x: ({ toggle }) => toggle(),
      y: ({ stop }) => stop(),
    };

    render(
      <AudioPlayer track={mockTrack} shortcuts={customShortcuts}>
        <div>Test Content</div>
      </AudioPlayer>,
    );

    const provider = screen.getByTestId("player-config-provider");
    expect(provider).toHaveAttribute("data-shortcut-keys", "x,y");
  });

  it("passes labels to PlayerConfigProvider", () => {
    render(
      <AudioPlayer
        track={mockTrack}
        labels={{ player: "Audioplayer", seek: ({ amount }) => `${amount}` }}
      >
        <div>Test Content</div>
      </AudioPlayer>,
    );

    expect(screen.getByTestId("player-config-provider")).toHaveAttribute(
      "data-label-keys",
      "player,seek",
    );
  });
});
