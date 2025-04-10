import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "../custom-render";
import { screen } from "@testing-library/react";
import { MuteButton } from "../../src/Player/MuteButton";

describe("MuteButton", () => {
  it("renders with correct aria-pressed attribute based on muted state", () => {
    render(
      <MuteButton>
        <MuteButton.Muted>Muted</MuteButton.Muted>
        <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
        <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
      </MuteButton>
    );

    // Get the button element
    const button = screen.getByLabelText("Mute");

    // Check that aria-pressed is false by default (not muted)
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("displays the correct volume state content", () => {
    // Render the MuteButton inside AudioPlayer for context
    render(
      <MuteButton>
        <MuteButton.Muted>Muted</MuteButton.Muted>
        <MuteButton.LowVolume>Low Volume</MuteButton.LowVolume>
        <MuteButton.HighVolume>High Volume</MuteButton.HighVolume>
      </MuteButton>
    );

    // By default, the volumeState should be "high"
    expect(screen.getByText("High Volume")).toBeInTheDocument();
    expect(screen.queryByText("Low Volume")).not.toBeInTheDocument();
    expect(screen.queryByText("Muted")).not.toBeInTheDocument();
  });
});
