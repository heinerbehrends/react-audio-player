/**
 * Tolerant equality for values that arrive as floats off a media element or out
 * of a slider's pixel arithmetic, where exact comparison is a coin toss.
 *
 * Lives in `Shared/` rather than in a domain module because it has consumers in
 * three of them — the write path, the rate buttons, and the store's
 * derivations — and belongs to none.
 */
export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.001;
}
