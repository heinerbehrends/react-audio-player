import { describe, it, expect } from "vitest";
import { createTestStore } from "./createTestStore";

/**
 * F13. After a `src` swap the store plays the new track if playback was wanted
 * before it. The fake stands in for the element; what a browser would do around
 * it — `paused` flipping, the `play` and `pause` events — is staged by hand.
 */
describe("continuePlayback", () => {
  /** Playing as a real element would be after `play()` and its event. */
  function playing() {
    const harness = createTestStore({ readyState: 1 });
    harness.store.send({ type: "PLAY" });
    harness.element.paused = false;
    harness.element.emit("play");
    harness.element.play.mockClear();
    return harness;
  }

  it("plays after a swap while playing", () => {
    const { store, element } = playing();
    // A swap pauses the element without a `pause` event.
    element.paused = true;

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });

  it("stays paused when nothing was playing", () => {
    const { store, element } = createTestStore({ readyState: 1 });

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /**
   * The click that plays a track and selects it: the swap commits before the
   * `play` event arrives, so the intent has to come from the command.
   */
  it("plays when play() was sent just before the swap", () => {
    const { store, element } = createTestStore({ readyState: 1 });
    store.send({ type: "PLAY" });
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });

  it("stays paused after pause() is sent", () => {
    const { store, element } = playing();
    store.send({ type: "PAUSE" });
    element.paused = true;
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  it("stays paused after a pause from outside the library", () => {
    const { store, element } = playing();
    element.paused = true;
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /** A playlist advanced from `onEnded`: the end paused it, the user did not. */
  it("plays after the track ended while playing", () => {
    const { store, element } = playing();
    element.paused = true;
    element.ended = true;
    element.emit("pause");
    element.emit("ended");

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });

  /** B4: Firefox fires `ended` on a paused seek to the end, and no `pause`. */
  it("stays paused after Firefox's ended on a paused seek", () => {
    const { store, element } = createTestStore({ readyState: 1 });
    element.ended = true;
    element.emit("ended");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  it.each([
    ["paused", true, 1],
    ["playing", false, 0],
  ] as const)("follows TOGGLE_PLAY from %s", (_state, paused, plays) => {
    const { store, element } = createTestStore({ readyState: 1, paused });
    store.send({ type: "TOGGLE_PLAY" });
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(plays);
  });

  it("does not ask again after the browser refused", async () => {
    const { store, element } = createTestStore({ readyState: 1 });
    element.play.mockReturnValueOnce(
      Promise.reject(new DOMException("blocked", "NotAllowedError")),
    );
    store.send({ type: "PLAY" });
    await Promise.resolve();
    await Promise.resolve();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /** A `pause` event that a later `play()` overtook says nothing about now. */
  it("ignores a pause event the element has since left", () => {
    const { store, element } = playing();
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });
});
