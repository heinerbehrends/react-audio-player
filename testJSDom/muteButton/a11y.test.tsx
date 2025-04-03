import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MuteButton } from "../../src/Player/MuteButton";
import { AudioPlayer } from "../../src/Player/AudioPlayer";

describe("MuteButton", () => {
  it("renders with correct aria-pressed attribute based on muted state", () => {
    // Mock the audio files for AudioPlayer
    const audioFiles = [{ src: "test-audio.mp3" }];

    // Render the MuteButton inside AudioPlayer for context
    render(
      <AudioPlayer audioFiles={audioFiles}>
        <MuteButton>
          <MuteButton.Muted>Muted</MuteButton.Muted>
          <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
          <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
        </MuteButton>
      </AudioPlayer>
    );

    // Get the button element
    const button = screen.getByLabelText("Mute");

    // Check that aria-pressed is false by default (not muted)
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("displays the correct volume state content", () => {
    // Mock the audio files for AudioPlayer
    const audioFiles = [{ src: "test-audio.mp3" }];

    // Render the MuteButton inside AudioPlayer for context
    render(
      <AudioPlayer audioFiles={audioFiles}>
        <MuteButton>
          <MuteButton.Muted>Muted</MuteButton.Muted>
          <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
          <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
        </MuteButton>
      </AudioPlayer>
    );

    // By default, the volumeState should be "high"
    expect(screen.getByText("High Volume")).toBeInTheDocument();
    expect(screen.queryByText("Low Volume")).not.toBeInTheDocument();
    expect(screen.queryByText("Muted")).not.toBeInTheDocument();
  });
});
