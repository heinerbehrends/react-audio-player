import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayButton } from "../../src/Player/PlayButton";
import { MuteButton } from "../../src/Player/MuteButton";
import { SeekButton } from "../../src/Player/SeekButton";
import { ErrorMessage } from "../../src/Player/ErrorMessage";
import { Time } from "../../src/TimeDisplay/TimeDisplay";
import { PlaybackRate } from "../../src/PlaybackRate/PlaybackRate";
import { PlaybackRateSlider } from "../../src/PlaybackRate/PlaybackRateSlider";
import { Timeline } from "../../src/Timeline/Timeline";
import { Volume } from "../../src/Volume/Volume";
import { renderInPlayer } from "../testComponents";
import { stubElementRects, stubResizeObserver } from "../testUtils";

/**
 * S9. `data-part` is the one selector the library promises not to move:
 * `aria-label` is documented as overridable for localisation (A15), so a
 * `button[aria-label="Play audio"]` rule breaks in translation.
 */
describe("data-part", () => {
  const parts: { name: string; part: string; ui: React.ReactNode }[] = [
    { name: "PlayButton", part: "play", ui: <PlayButton>play</PlayButton> },
    { name: "MuteButton", part: "mute", ui: <MuteButton>mute</MuteButton> },
    {
      name: "SeekButton",
      part: "seek",
      ui: <SeekButton amount={10}>seek</SeekButton>,
    },
    {
      name: "Time.Toggle",
      part: "time-toggle",
      ui: <Time.Toggle>toggle</Time.Toggle>,
    },
    {
      name: "PlaybackRate.Set",
      part: "rate-set",
      ui: <PlaybackRate.Set rate={1.5}>1.5x</PlaybackRate.Set>,
    },
    {
      name: "PlaybackRate.Change",
      part: "rate-change",
      ui: <PlaybackRate.Change amount={0.25}>faster</PlaybackRate.Change>,
    },
    {
      name: "PlaybackRate.Display",
      part: "rate-display",
      ui: <PlaybackRate.Display />,
    },
    { name: "Time.Elapsed", part: "elapsed", ui: <Time.Elapsed /> },
    { name: "Time.Duration", part: "duration", ui: <Time.Duration /> },
  ];

  it.each(parts)("$name carries data-part=$part", ({ part, ui }) => {
    const { container } = renderInPlayer(ui, {
      element: { readyState: 1, duration: 100 },
    });

    expect(
      container.querySelector(`[data-part="${part}"]`),
    ).toBeInTheDocument();
  });

  it("Time.Remaining carries data-part=remaining", () => {
    const { container } = renderInPlayer(
      <>
        <Time.Toggle>toggle</Time.Toggle>
        <Time.Remaining />
      </>,
      { element: { readyState: 1, duration: 100 } },
    );

    // Hidden until the toggle selects it, so it needs the click the others do not.
    fireEvent.click(screen.getByRole("button"));
    expect(
      container.querySelector('[data-part="remaining"]'),
    ).toBeInTheDocument();
  });

  it("ErrorMessage carries data-part=error", () => {
    const { container } = renderInPlayer(<ErrorMessage>broken</ErrorMessage>, {
      element: { readyState: 0, error: {} as MediaError },
    });

    expect(container.querySelector('[data-part="error"]')).toBeInTheDocument();
  });

  it("is overridable, being in the defaults tier", () => {
    renderInPlayer(<PlayButton data-part="mine">play</PlayButton>);

    expect(screen.getByRole("button")).toHaveAttribute("data-part", "mine");
  });
});

describe("slider data attributes", () => {
  let restoreRects: () => void;

  beforeEach(() => {
    stubResizeObserver();
    restoreRects = stubElementRects();
  });

  afterEach(() => restoreRects());

  type RootProps = React.HTMLAttributes<HTMLDivElement>;

  const sliders: { name: string; ui: (props: RootProps) => React.ReactNode }[] =
    [
      {
        name: "Timeline",
        ui: (props) => (
          <Timeline {...props}>
            <Timeline.Background />
            <Timeline.Progress />
            <Timeline.Control>track</Timeline.Control>
            <Timeline.Thumb />
          </Timeline>
        ),
      },
      {
        name: "Volume",
        ui: (props) => (
          <Volume {...props}>
            <Volume.Background />
            <Volume.Progress />
            <Volume.Control>track</Volume.Control>
            <Volume.Thumb />
          </Volume>
        ),
      },
      {
        name: "PlaybackRateSlider",
        ui: (props) => (
          <PlaybackRateSlider {...props}>
            <PlaybackRateSlider.Background />
            <PlaybackRateSlider.Progress />
            <PlaybackRateSlider.Control>track</PlaybackRateSlider.Control>
            <PlaybackRateSlider.Thumb />
          </PlaybackRateSlider>
        ),
      },
    ];

  describe.each(sliders)("$name", ({ ui }) => {
    it("names all five parts", () => {
      const { container } = renderInPlayer(ui({}), {
        element: { readyState: 1, duration: 100 },
      });

      for (const part of [
        "root",
        "control",
        "progress",
        "background",
        "thumb",
      ]) {
        expect(
          container.querySelector(`[data-part="${part}"]`),
          `missing data-part="${part}"`,
        ).toBeInTheDocument();
      }
    });

    it("carries drag state and orientation on the root, and nowhere else", () => {
      const { container } = renderInPlayer(ui({}), {
        element: { readyState: 1, duration: 100 },
      });
      const root = container.querySelector('[data-part="root"]')!;

      expect(root).toHaveAttribute("data-state", "idle");
      expect(root).toHaveAttribute("data-orientation", "horizontal");
      expect(container.querySelectorAll("[data-state]")).toHaveLength(1);
      expect(container.querySelectorAll("[data-orientation]")).toHaveLength(1);
    });
  });

  it("reports a vertical Volume's orientation on the root", () => {
    const { container } = renderInPlayer(
      <Volume orientation="vertical">
        <Volume.Control>track</Volume.Control>
      </Volume>,
    );

    expect(container.querySelector('[data-part="root"]')).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  /**
   * The roots disagreed about spread order before this pass — `rootStyles`
   * carries `position: relative`, which the thumb's `transform` is placed
   * against, so a consumer `style` that replaced it rather than merging would
   * silently move every thumb.
   */
  it.each(sliders)("$name merges a consumer style over its own", ({ ui }) => {
    const { container } = renderInPlayer(ui({ style: { height: "40px" } }), {
      element: { readyState: 1, duration: 100 },
    });

    expect(container.querySelector('[data-part="root"]')).toHaveStyle({
      height: "40px",
      position: "relative",
    });
  });
});
