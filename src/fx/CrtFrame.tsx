/* ---------------------------------------------------------------------------
 * CrtFrame — the tube every route is rendered inside.
 *
 *   .crt-bezel          the physical frame from `eva-magi-2.png`
 *     └ .crt-content    page DOM, softened by the global blur/contrast filter
 *   ScanlineOverlay     fixed decorative layers (scanlines … vignette)
 *   PhosphorFilters     0x0 <svg> holding #phosphor-bloom / #chroma-shift /
 *                       #crt-grain — kept outside .crt-content so the filtered
 *                       content never re-filters the filter bank itself.
 *
 * Content stays real DOM text: selectable, searchable, screen-reader friendly.
 * ------------------------------------------------------------------------- */
import type { ReactNode } from 'react'
import { PhosphorFilters } from './PhosphorFilters'
import { ScanlineOverlay } from './ScanlineOverlay'

export function CrtFrame({ children }: { children: ReactNode }) {
  return (
    <div className="crt-bezel" data-crt="bezel">
      <div className="crt-content" data-crt="content">
        {children}
      </div>
      <ScanlineOverlay />
      <PhosphorFilters />
    </div>
  )
}
