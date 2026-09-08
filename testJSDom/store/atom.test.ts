import { describe, it, expect, vi } from "vitest";
import { atom, readable } from "../../src/store/atom";

describe("atom", () => {
  it("returns the initial value", () => {
    expect(atom(3).get()).toBe(3);
  });

  it("notifies subscribers on a changed value", () => {
    const count = atom(0);
    const listener = vi.fn();
    count.subscribe(listener);

    count.set(1);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(count.get()).toBe(1);
  });

  it("bails out when the next value is identical", () => {
    const count = atom(0);
    const listener = vi.fn();
    count.subscribe(listener);

    count.set(0);

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies every subscriber", () => {
    const count = atom(0);
    const first = vi.fn();
    const second = vi.fn();
    count.subscribe(first);
    count.subscribe(second);

    count.set(1);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    const count = atom(0);
    const listener = vi.fn();
    const unsubscribe = count.subscribe(listener);

    unsubscribe();
    count.set(1);

    expect(listener).not.toHaveBeenCalled();
    expect(count.get()).toBe(1);
  });

  it("unsubscribing one subscriber leaves the others", () => {
    const count = atom(0);
    const staying = vi.fn();
    const leaving = vi.fn();
    count.subscribe(staying);
    const unsubscribe = count.subscribe(leaving);

    unsubscribe();
    count.set(1);

    expect(staying).toHaveBeenCalledTimes(1);
    expect(leaving).not.toHaveBeenCalled();
  });

  it("treats NaN as unchanged, matching React's Object.is comparison", () => {
    const value = atom(Number.NaN);
    const listener = vi.fn();
    value.subscribe(listener);

    value.set(Number.NaN);

    expect(listener).not.toHaveBeenCalled();
  });

  it("distinguishes 0 from -0, matching Object.is", () => {
    const value = atom(0);
    const listener = vi.fn();
    value.subscribe(listener);

    value.set(-0);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("hands out stable get and subscribe references", () => {
    const value = atom(0);

    expect(value.get).toBe(value.get);
    expect(value.subscribe).toBe(value.subscribe);
  });
});

describe("readable", () => {
  it("drops the set handle", () => {
    const projection = readable(atom(0));

    expect("set" in projection).toBe(false);
  });

  it("reads and subscribes through to the source atom", () => {
    const source = atom(0);
    const projection = readable(source);
    const listener = vi.fn();
    projection.subscribe(listener);

    source.set(2);

    expect(projection.get()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
