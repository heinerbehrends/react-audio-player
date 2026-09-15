import { describe, it, expect, vi } from "vitest";
import { composeEventHandlers } from "../../src/Shared/composeEventHandlers";

/** The shape the helper actually depends on — a synthetic event, narrowed. */
const event = (defaultPrevented = false) => ({ defaultPrevented });

describe("composeEventHandlers", () => {
  it("runs the consumer's handler before the library's", () => {
    const order: string[] = [];
    const composed = composeEventHandlers(
      () => order.push("theirs"),
      () => order.push("ours"),
    );

    composed(event());

    expect(order).toEqual(["theirs", "ours"]);
  });

  it("runs the library's handler when there is no consumer handler", () => {
    const ours = vi.fn();

    composeEventHandlers(undefined, ours)(event());

    expect(ours).toHaveBeenCalledTimes(1);
  });

  /**
   * The opt-out, and the whole reason for consumer-first ordering: a consumer
   * who wants to suppress the library's behaviour has a documented way to.
   */
  it("skips the library's handler when the consumer prevented default", () => {
    const ours = vi.fn();
    const theirs = (e: { defaultPrevented: boolean }) => {
      e.defaultPrevented = true;
    };

    composeEventHandlers(theirs, ours)(event());

    expect(ours).not.toHaveBeenCalled();
  });

  it("skips the library's handler for an already-prevented event", () => {
    const ours = vi.fn();

    composeEventHandlers(vi.fn(), ours)(event(true));

    expect(ours).not.toHaveBeenCalled();
  });

  it("passes the same event object to both", () => {
    const seen: unknown[] = [];
    const e = event();

    composeEventHandlers(
      (x) => seen.push(x),
      (x) => seen.push(x),
    )(e);

    expect(seen).toEqual([e, e]);
  });
});
