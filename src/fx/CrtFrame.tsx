/* ---------------------------------------------------------------------------
 * CrtFrame — the tube every route is rendered inside.
 *
 *   .crt-bezel          the physical frame from `eva-magi-2.png`
 *     ├ .crt-content    page DOM, softened by the global blur/contrast filter
 *     ├ {floatingChrome} escape hatch — see below
 *   ScanlineOverlay     fixed decorative layers (scanlines … vignette)
 *   PhosphorFilters     0x0 <svg> holding #phosphor-bloom / #chroma-shift /
 *                       #crt-grain — kept outside .crt-content so the filtered
 *                       content never re-filters the filter bank itself.
 *
 * Content stays real DOM text: selectable, searchable, screen-reader friendly.
 *
 * `floatingChrome` (added Task 5). `.crt-content`'s CSS `filter` makes it a
 * containing block for `position: fixed` descendants (documented in
 * `styles/crt.css`), so a fixed element rendered inside it anchors to
 * `.crt-content`'s own box instead of the viewport. `floatingChrome` renders
 * as a sibling of `.crt-content` instead — still inside `.crt-bezel` (so it
 * sits under the same rounded tube and the same scanline/vignette overlays,
 * which paint over it too, keeping the CRT look consistent) but outside the
 * filter, so `position: fixed` inside it behaves normally. Task 5 uses this
 * for the mobile bottom tab bar (`HudHeader`'s `MobileTabBar`); Task 10's
 * full-viewport `BootScreen` is expected to use the same slot.
 * ------------------------------------------------------------------------- */
import type { ReactNode } from 'react'
import { PhosphorFilters } from './PhosphorFilters'
import { ScanlineOverlay } from './ScanlineOverlay'

export function CrtFrame({
  children,
  floatingChrome,
}: {
  children: ReactNode
  /** Rendered as a sibling of `.crt-content`, unaffected by its filter. */
  floatingChrome?: ReactNode
}) {
  return (
    <div className="crt-bezel" data-crt="bezel">
      <div className="crt-content" data-crt="content">
        {children}
      </div>
      {floatingChrome}
      <ScanlineOverlay />
      <PhosphorFilters />
    </div>
  )
}
