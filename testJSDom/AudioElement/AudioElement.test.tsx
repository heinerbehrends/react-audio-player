import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AudioElement } from "../../src/AudioElement/AudioElement";
import { renderInPlayer } from "../testComponents";

/**
 * The element carries exactly one React handler, `onEnded`, and it is policy
 * rather than projection. Every other listener belongs to `syncFromElement`,
 * attached through `attach`.
 */
describe("AudioElement", () => {
  it("renders with proper accessibility attributes", () => {
    renderInPlayer(<AudioElement />);

    expect(screen.getByLabelText("audio player")).toHaveAttribute(
      "aria-label",
      "audio player",
    );
  });

  it("sets the src from the config's audio file", () => {
    renderInPlayer(<AudioElement />, {
      audioFile: { src: "test-audio.mp3" },
    });

    expect(screen.getByLabelText("audio player")).toHaveAttribute(
      "src",
      "test-audio.mp3",
    );
  });

  /**
   * The `ended` policy: moving the element itself to 0, rather than pushing the
   * thumb there, keeps the clock and the thumb in agreement.
   */
  it("returns the element to the start when playback ends", () => {
    renderInPlayer(<AudioElement />);
    const audio = screen.getByLabelText("audio player") as HTMLAudioElement;
    // jsdom's `<audio>` is inert, so assign a time the handler can reset.
    Object.defineProperty(audio, "currentTime", { value: 100, writable: true });

    audio.dispatchEvent(new Event("ended"));

    expect(audio.currentTime).toBe(0);
  });

  /**
   * The playlist hook. The rewind above clears `el.ended` within a tick, so
   * what matters is that the callback fires exactly once per `ended`, and after
   * the rewind.
   */
  it("calls onEnded once per ended, with the element already back at 0", () => {
    const onEnded = vi.fn();
    renderInPlayer(<AudioElement onEnded={onEnded} />);
    const audio = screen.getByLabelText("audio player") as HTMLAudioElement;
    Object.defineProperty(audio, "currentTime", { value: 100, writable: true });

    audio.dispatchEvent(new Event("ended"));

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
  });

  it("does not require onEnded", () => {
    renderInPlayer(<AudioElement />);
    const audio = screen.getByLabelText("audio player") as HTMLAudioElement;

    expect(() => audio.dispatchEvent(new Event("ended"))).not.toThrow();
  });

  /**
   * The escape hatch. `crossOrigin` has no workaround — without it
   * `createMediaElementSource` taints and Web Audio is off the table — so
   * arbitrary attributes and `<track>` children both have to reach the element.
   */
  it("forwards arbitrary props to the element", () => {
    renderInPlayer(<AudioElement preload="none" crossOrigin="anonymous" />);
    const audio = screen.getByLabelText("audio player");

    expect(audio).toHaveAttribute("preload", "none");
    expect(audio).toHaveAttribute("crossorigin", "anonymous");
  });

  it("renders children into the element, so <track> is reachable", () => {
    renderInPlayer(
      <AudioElement>
        <track kind="captions" src="captions.vtt" srcLang="en" default />
      </AudioElement>,
    );

    const track = screen.getByLabelText("audio player").querySelector("track");
    expect(track).toHaveAttribute("kind", "captions");
    expect(track).toHaveAttribute("src", "captions.vtt");
  });

  it("does not let a forwarded prop override the store's own src", () => {
    renderInPlayer(<AudioElement />, { audioFile: { src: "from-config.mp3" } });

    expect(screen.getByLabelText("audio player")).toHaveAttribute(
      "src",
      "from-config.mp3",
    );
  });

  it("fills a consumer's object ref with the element, and clears it", () => {
    const audioRef = {
      current: null,
    } as React.MutableRefObject<HTMLAudioElement | null>;
    const { unmount } = renderInPlayer(<AudioElement audioRef={audioRef} />);

    expect(audioRef.current).toBe(screen.getByLabelText("audio player"));

    unmount();
    expect(audioRef.current).toBeNull();
  });

  it("calls a consumer's callback ref with the element", () => {
    const seen: (HTMLAudioElement | null)[] = [];
    renderInPlayer(<AudioElement audioRef={(node) => seen.push(node)} />);

    expect(seen.at(-1)).toBe(screen.getByLabelText("audio player"));
  });

  it("attaches the element to the store once, across parent rerenders", () => {
    const { store, rerender } = renderInPlayer(<AudioElement />);
    const attach = vi.spyOn(store, "attach");

    rerender(<AudioElement />);

    expect(attach).not.toHaveBeenCalled();
  });
});
