/* ---------------------------------------------------------------------------
 * clock.ts — the `T+H:MM:SSmmm` telemetry timestamp used by `HudHeader`'s
 * live clock (and available to Task 10's boot-sequence timer later).
 *
 * Format, read off `pilot-sync-1.gif`'s on-screen timer (`±0:02:18649`) and
 * pinned by PLAN Task 5's own example (`+0:38:50909`):
 *
 *   T+          fixed prefix (the reference uses `±`; this clock only counts
 *               up, so it is always `+`)
 *   H           hours, NO leading zero — `0`, `3`, `14`, …
 *   :           separator
 *   MM          minutes, zero-padded to 2 digits
 *   :           separator
 *   SSmmm       seconds and milliseconds concatenated with NO separator
 *               between them, each zero-padded (2 digits, 3 digits) — this is
 *               what makes the reference read as one dense 5-digit run
 *               ("50909" = seconds "50" + milliseconds "909").
 *
 * `formatTelemetryTime` is a pure function of the `Date` it is given — it
 * never calls `Date.now()` itself — so callers (a `setInterval` tick, a test,
 * a future boot-sequence stopwatch) decide what instant it means.
 * ------------------------------------------------------------------------- */

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

export function formatTelemetryTime(d: Date): string {
  const hours = d.getHours()
  const minutes = pad(d.getMinutes(), 2)
  const seconds = pad(d.getSeconds(), 2)
  const milliseconds = pad(d.getMilliseconds(), 3)
  return `T+${hours}:${minutes}:${seconds}${milliseconds}`
}
