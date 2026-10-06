/**
 * Formats seconds as `M:SS`, or `H:MM:SS` from an hour up. Non-finite and
 * negative input formats as `0:00`.
 */
export function formatTime(time: number) {
  const clamped = Number.isFinite(time) && time > 0 ? time : 0;
  const roundedTime = Math.round(clamped);
  const seconds = roundedTime % 60;
  const totalMinutes = Math.floor(roundedTime / 60);
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (totalMinutes < 60) {
    return `${totalMinutes}:${paddedSeconds}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSeconds}`;
}
