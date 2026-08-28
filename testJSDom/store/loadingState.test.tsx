import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayButton } from "../../src/Player/PlayButton";
import { MuteButton } from "../../src/Player/MuteButton";
import { SeekButton } from "../../src/Player/SeekButton";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { SetPlaybackRate } from "../../src/PlaybackRate/SetPlaybackRate";
import { ChangePlaybackRate } from "../../src/PlaybackRate/ChangePlaybackRate";
import { renderWithStore } from "./renderWithStore";

/**
 * `useIsDisabled` gates six components on the load state. Tested in jsdom rather
 * than E2E because loading is transient and racy in a real browser and
 * deterministic here: leave the fake at `readyState: 0` and all six are
 * disabled.
 */
function renderAll() {
  return (
    <>
      <PlayButton>play</PlayButton>
      <MuteButton>mute</MuteButton>
      <SeekButton amount={10}>seek</SeekButton>
      <Time.Toggle>toggle</Time.Toggle>
      <SetPlaybackRate rate={1.5}>1.5x</SetPlaybackRate>
      <ChangePlaybackRate amount={0.25}>faster</ChangePlaybackRate>
    </>
  );
}

const expectedCount = 6;

describe("the loading gate", () => {
  it("disables all six components before metadata arrives", () => {
    renderWithStore(renderAll(), { element: { readyState: 0 } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) => expect(button).toBeDisabled());
  });

  it("disables all six on an error", () => {
    renderWithStore(renderAll(), { element: { error: {} as MediaError } });

    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
  });

  it("enables all six once the element is ready", () => {
    renderWithStore(renderAll(), { element: { readyState: 1 } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(expectedCount);
    buttons.forEach((button) => expect(button).not.toBeDisabled());
  });

  it("releases the gate when loadedmetadata arrives", () => {
    const { element, emit } = renderWithStore(renderAll(), {
      element: { readyState: 0 },
    });
    expect(screen.getAllByRole("button")[0]).toBeDisabled();

    element.readyState = 1;
    emit("loadedmetadata");

    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).not.toBeDisabled());
  });
});
