/* ---------------------------------------------------------------------------
 * HudHeader — the terminal's masthead: callsign, the four `ROUTES` as nav
 * tabs, a live telemetry clock, and the manual FX toggle (PLAN Task 5).
 *
 * Two components share this one file because they share state (`ROUTES`, the
 * ticking clock, `useFx`) and because Task 3's `.crt-content` constraint
 * splits them physically in the tree, not just visually:
 *
 *   HudHeader     normal in-flow chrome, rendered inside `.crt-content` (so
 *                 it gets the same CRT blur/bloom as the rest of the page).
 *                 Desktop (`md:` and up, ≥768px): callsign left, nav tabs
 *                 centre, clock + FX toggle right. Below 768px the row
 *                 collapses to callsign + clock only — the tabs move to
 *                 `MobileTabBar`.
 *   MobileTabBar  the below-768px fixed bottom tab bar. `.crt-content`
 *                 carries a CSS `filter` (Task 3), which makes it a
 *                 containing block for `position: fixed` descendants — a bar
 *                 rendered inside it would anchor to `.crt-content`'s own
 *                 box instead of the viewport. So `App.tsx` passes this
 *                 component to `CrtFrame`'s `floatingChrome` prop, which
 *                 renders it as a sibling of `.crt-content`: outside the
 *                 filter (so `position: fixed` behaves normally) but still
 *                 inside the bezel and under the scanline/vignette overlays,
 *                 so it keeps the tube look. It always mounts; `md:hidden`
 *                 is what actually keeps it off desktop, matching
 *                 `HudHeader`'s `hidden md:flex` desktop row so exactly one
 *                 of the two is exposed to assistive tech at any width
 *                 (`display: none` removes an element from the a11y tree).
 *
 * The clock ticks at 100ms (PLAN step 1) using the pure `formatTelemetryTime`
 * — this component is the only place that calls `new Date()`. Its digits are
 * `aria-hidden`: PLAN Task 5 step 6 asks that a 10Hz data update not be
 * announced by screen readers, and no `aria-live` region is attached here,
 * so nothing re-announces on every tick. A static `sr-only` label gives
 * assistive tech one-time context instead of a value that goes stale the
 * instant it is read. The format is also layout-stable: `font-mono` is
 * monospace and every field but the hour is zero-padded to a fixed width, so
 * the string only changes length once an hour (09 → 10) rather than on every
 * tick; `tabular-nums` is added defensively in case a fallback font ever
 * applies.
 * ------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { ROUTES } from '../../routes'
import { useFx } from '../../fx/useFx'
import { formatTelemetryTime } from '../../lib/clock'
import { BoxedLabel } from '../ui/BoxedLabel'
import { StatusBar } from '../ui/StatusBar'
import { NavTab } from './NavTab'

/** Matches the pilot-sync GIFs' telemetry tick (PLAN Task 5 step 1). */
const CLOCK_TICK_MS = 100

function useTelemetryClock(): string {
  const [now, setNow] = useState(() => formatTelemetryTime(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(formatTelemetryTime(new Date()))
    }, CLOCK_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  return now
}

function TelemetryClock({ className }: { className?: string }) {
  const telemetry = useTelemetryClock()
  return (
    <StatusBar className={className}>
      <span className="sr-only">System clock</span>
      <span className="tabular-nums" aria-hidden="true">
        {telemetry}
      </span>
    </StatusBar>
  )
}

function FxToggle() {
  const { fxOn, toggleFx } = useFx()
  return (
    <BoxedLabel
      as="button"
      type="button"
      tone={fxOn ? 'acid' : 'alert'}
      aria-pressed={fxOn}
      aria-label={fxOn ? 'Turn CRT effects off' : 'Turn CRT effects on'}
      onClick={toggleFx}
    >
      FX {fxOn ? 'ON' : 'OFF'}
    </BoxedLabel>
  )
}

export function HudHeader() {
  return (
    <header className="border-steel/60 relative z-10 border-b px-4 py-3 md:px-6">
      {/* Desktop (≥768px): callsign / nav / clock+FX, three-column row. */}
      <div className="hidden items-center justify-between gap-6 md:flex">
        <div className="flex flex-col">
          <span className="font-display display-compressed text-glow-nerv text-nerv text-3xl leading-none uppercase">
            J. EMSLEY
          </span>
          <span className="font-mono text-bone tracking-telemetry mt-1 text-xs uppercase">
            UNIT-01 // PILOT TERMINAL
          </span>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-3">
          {ROUTES.map((route, i) => (
            <NavTab key={route.path} route={route} index={i + 1} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <TelemetryClock />
          <FxToggle />
        </div>
      </div>

      {/* Below 768px: header collapses to callsign + clock. The tabs move to
          the fixed `MobileTabBar`, rendered outside `.crt-content`. */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <span className="font-display display-compressed text-glow-nerv text-nerv text-xl leading-none uppercase">
          J. EMSLEY
        </span>
        <TelemetryClock />
      </div>
    </header>
  )
}

/**
 * The mobile (below 768px) fixed bottom nav bar. Rendered by `App.tsx` via
 * `CrtFrame`'s `floatingChrome` prop — see the file header comment for why
 * it cannot live inside `HudHeader`'s own normal-flow markup.
 */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="border-steel/60 bg-ink/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t md:hidden"
    >
      {ROUTES.map((route, i) => (
        <NavTab
          key={route.path}
          route={route}
          index={i + 1}
          className="flex flex-col items-center justify-center py-2"
        />
      ))}
    </nav>
  )
}
