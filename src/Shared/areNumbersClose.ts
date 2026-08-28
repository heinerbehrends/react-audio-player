/**
 * Tolerant equality, within 0.001. For values that arrive as floats off a media
 * element or out of a slider's pixel arithmetic, where exact comparison is a
 * coin toss.
 *
 * In `Shared/` because its consumers span three domains and it belongs to none.
 */
export function areNumbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.001;
}
