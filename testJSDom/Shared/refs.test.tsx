import { createRef, type ReactElement, type Ref } from "react";
import { describe, expect, it } from "vitest";
import {
  ErrorMessage,
  MuteButton,
  PlayButton,
  PlaybackRate,
  PlaybackRateSlider,
  PlayerRoot,
  SeekButton,
  Time,
  Timeline,
  TimelineBuffered,
  Volume,
} from "../../src/index";
import { renderWithStore } from "../store/renderWithStore";

type Case = [
  name: string,
  render: (ref: Ref<never>) => ReactElement,
  /** What the ref has to hold: the part's own element. */
  part: string,
];

const CASES: Case[] = [
  ["PlayerRoot", (ref) => <PlayerRoot ref={ref} />, "player"],
  ["PlayButton", (ref) => <PlayButton ref={ref}>x</PlayButton>, "play"],
  ["MuteButton", (ref) => <MuteButton ref={ref}>x</MuteButton>, "mute"],
  [
    "SeekButton",
    (ref) => (
      <SeekButton ref={ref} amount={10}>
        x
      </SeekButton>
    ),
    "seek",
  ],
  [
    "Timeline",
    (ref) => (
      <Timeline ref={ref}>
        <Timeline.Control />
      </Timeline>
    ),
    "root",
  ],
  [
    "Timeline.Control",
    (ref) => (
      <Timeline>
        <Timeline.Control ref={ref} />
      </Timeline>
    ),
    "control",
  ],
  [
    "Timeline.Progress",
    (ref) => (
      <Timeline>
        <Timeline.Progress ref={ref} />
      </Timeline>
    ),
    "progress",
  ],
  [
    "Timeline.Background",
    (ref) => (
      <Timeline>
        <Timeline.Background ref={ref} />
      </Timeline>
    ),
    "background",
  ],
  [
    "Timeline.Thumb",
    (ref) => (
      <Timeline>
        <Timeline.Thumb ref={ref} />
      </Timeline>
    ),
    "thumb",
  ],
  ["TimelineBuffered", (ref) => <TimelineBuffered ref={ref} />, "buffered"],
  [
    "Volume",
    (ref) => (
      <Volume ref={ref}>
        <Volume.Control />
      </Volume>
    ),
    "root",
  ],
  [
    "PlaybackRateSlider",
    (ref) => (
      <PlaybackRateSlider ref={ref}>
        <PlaybackRateSlider.Control />
      </PlaybackRateSlider>
    ),
    "root",
  ],
  ["PlaybackRate", (ref) => <PlaybackRate ref={ref}>x</PlaybackRate>, "root"],
  [
    "PlaybackRate.Set",
    (ref) => (
      <PlaybackRate.Set ref={ref} rate={1.5}>
        x
      </PlaybackRate.Set>
    ),
    "rate-set",
  ],
  [
    "PlaybackRate.Change",
    (ref) => (
      <PlaybackRate.Change ref={ref} amount={0.25}>
        x
      </PlaybackRate.Change>
    ),
    "rate-change",
  ],
  [
    "PlaybackRate.Display",
    (ref) => <PlaybackRate.Display ref={ref} />,
    "rate-display",
  ],
  ["Time.Toggle", (ref) => <Time.Toggle ref={ref} />, "time-toggle"],
  ["Time.Elapsed", (ref) => <Time.Elapsed ref={ref} />, "elapsed"],
  ["Time.Remaining", (ref) => <Time.Remaining ref={ref} />, "remaining"],
  ["Time.Duration", (ref) => <Time.Duration ref={ref} />, "duration"],
];

describe("refs", () => {
  it.each(CASES)(
    "%s forwards its ref to its own element",
    (_, render, part) => {
      const ref = createRef<HTMLElement>();
      renderWithStore(render(ref as Ref<never>));

      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current).toHaveAttribute("data-part", part);
    },
  );

  // No `data-part` of its own: a marker inside `.Set`.
  it("PlaybackRate.Current forwards its ref to its span", () => {
    const ref = createRef<HTMLSpanElement>();
    renderWithStore(
      <PlaybackRate.Current ref={ref} rate={1}>
        ✓
      </PlaybackRate.Current>,
    );

    expect(ref.current?.tagName).toBe("SPAN");
    expect(ref.current).toHaveTextContent("✓");
  });

  it("ErrorMessage forwards its ref while it shows", () => {
    const ref = createRef<HTMLDivElement>();
    renderWithStore(<ErrorMessage ref={ref}>Failed</ErrorMessage>, {
      element: { readyState: 0, error: {} as MediaError },
    });

    expect(ref.current).toHaveAttribute("data-part", "error");
  });

  // `.Control` measures its own element through a ref, and still has to.
  it("Timeline.Control keeps measuring with a ref of the caller's", () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = renderWithStore(
      <Timeline>
        <Timeline.Control ref={ref} />
      </Timeline>,
    );

    expect(ref.current).toBe(container.querySelector('[role="slider"]'));
    expect(ref.current).toHaveAttribute("aria-valuemax", "100");
  });
});
