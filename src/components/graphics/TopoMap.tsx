/* ---------------------------------------------------------------------------
 * TopoMap — the terminal's ground texture (PLAN Task 8, revised by R3 + R4).
 *
 * A decorative `<canvas>` that draws `references/eva-map-ex.png`: a stack of
 * horizontal PROFILE LINES across a heightfield (not iso-contours — see the
 * long note in `topoRender.ts`), red splines for named ground features, and
 * `bone` registration cross-hairs.
 *
 * The ground is real: a 15 km window over West Lafayette / Purdue, baked from
 * public-domain USGS 3DEP / SRTM elevation at BUILD time by
 * `scripts/bake-terrain.mjs` and fetched as a static byte grid. `source="noise"`
 * swaps in procedural terrain from `lib/noise.ts`, which is also what the
 * component falls back to if the baked asset is ever missing.
 *
 * Usage — it fills its nearest positioned ancestor, so give that a size:
 *
 *   <div className="relative h-[60vh]">
 *     <TopoMap opacity={0.35} />
 *     …content…
 *   </div>
 *
 * Vary `view` and `opacity` per page so the map never repeats one image:
 * full-bleed behind Home, a tighter window at lower opacity behind the
 * Projects grid, a short band on Pilot and Resume.
 *
 * Constraints honoured: `aria-hidden` (it carries no information), colours
 * read from `--color-*` tokens instead of literals, `devicePixelRatio` aware,
 * redraws through a `ResizeObserver`, and drifts only when `motionOn` — at
 * 10 fps, far under the 3 Hz state-change ceiling and cheap enough to leave on.
 * Never wrap it in `.crt-bloom`: that class makes a containing block and the
 * halo on 40-odd polylines is expensive.
 * ------------------------------------------------------------------------- */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFx } from '../../fx/useFx'
import { cn } from '../../lib/cn'
import type { Peak } from '../../lib/noise'
import {
  DEFAULT_PEAKS,
  TERRAIN_FEATURES,
  TERRAIN_META,
  createFallbackField,
  loadBakedTerrain,
  type TerrainField,
} from '../../lib/terrain'
import { drawTopoMap, type TopoPalette } from './topoRender'

/** `terrain` = the baked West Lafayette DEM; `noise` = invented ground. */
export type TopoMapSource = 'terrain' | 'noise'

export type TopoMapProps = {
  source?: TopoMapSource
  /**
   * Sub-rectangle of the field to draw, in 0-1 field coordinates (y = 0 is
   * north). Defaults to the whole 15 km window. Narrow it to zoom in — a page
   * that wants a different-looking map should move this rather than re-seed.
   */
  view?: { x?: number; y?: number; width?: number; height?: number }
  /** Profile lines, far to near. */
  lines?: number
  /** Vertical exaggeration. Raise it when `view` covers flat ground. */
  relief?: number
  /** Canvas opacity — the per-page dimmer. */
  opacity?: number
  /** Procedural seed, used when `source="noise"` or the asset is missing. */
  seed?: number
  /** Procedural summits. Memoise or hoist if you pass your own. */
  peaks?: readonly Peak[]
  /** Draw the red WABASH / SR-26 / US-231 splines. */
  features?: boolean
  /** Draw the `+` registration marks and their coordinate tags. */
  registration?: boolean
  /** Allow the slow vertical drift. Still gated on `motionOn`. */
  drift?: boolean
  className?: string
}

/* --- motion budget ------------------------------------------------------- */

/** One full there-and-back drift cycle. */
const DRIFT_PERIOD_MS = 44_000
/** How far the window travels, in field fractions. Deliberately tiny. */
const DRIFT_SPAN = 0.06
/** 10 fps. A profile-line frame is cheap, but there is no reason to run at 60. */
const DRIFT_FRAME_MS = 100
/** Retina is worth it; a 3x phone is not, for a background texture. */
const MAX_DPR = 2

/* --- palette ------------------------------------------------------------- */

/**
 * Resolves the design tokens off the canvas itself, so a section can retint
 * the map by overriding `--color-*` on an ancestor. No colour is named here —
 * `src/styles/tokens.css` stays the single source of truth.
 */
function readPalette(el: Element): TopoPalette {
  const styles = getComputedStyle(el)
  const token = (name: string): string => styles.getPropertyValue(name).trim()
  return {
    ground: token('--color-ink'),
    line: token('--color-acid'),
    mark: token('--color-bone'),
    feature: token('--color-alert'),
    fontFamily: token('--font-mono') || 'monospace',
  }
}

/* --- component ----------------------------------------------------------- */

export function TopoMap({
  source = 'terrain',
  view,
  lines = 44,
  relief = 1,
  opacity = 1,
  seed = 7,
  peaks = DEFAULT_PEAKS,
  features = true,
  registration = true,
  drift = true,
  className,
}: TopoMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { motionOn } = useFx()

  const viewX = view?.x ?? 0
  const viewY = view?.y ?? 0
  const viewW = view?.width ?? 1
  const viewH = view?.height ?? 1

  /* `undefined` = the baked asset is still in flight; `null` = it is not
     coming, so use procedural ground instead. */
  const [baked, setBaked] = useState<TerrainField | null | undefined>(undefined)

  useEffect(() => {
    if (source !== 'terrain') return
    let alive = true
    void loadBakedTerrain().then((result) => {
      if (alive) setBaked(result)
    })
    return () => {
      alive = false
    }
  }, [source])

  const fallback = useMemo(
    () => createFallbackField(seed, peaks),
    [seed, peaks],
  )

  const field: TerrainField | null =
    source === 'noise'
      ? fallback
      : baked === undefined
        ? null
        : (baked ?? fallback)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !field) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = readPalette(canvas)
    let raf = 0

    const paint = (driftY: number): void => {
      const cssWidth = canvas.clientWidth
      const cssHeight = canvas.clientHeight
      if (cssWidth <= 0 || cssHeight <= 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const pixelWidth = Math.round(cssWidth * dpr)
      const pixelHeight = Math.round(cssHeight * dpr)
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      drawTopoMap(ctx, {
        width: cssWidth,
        height: cssHeight,
        field,
        view: { x: viewX, y: viewY + driftY, width: viewW, height: viewH },
        lines,
        relief,
        palette,
        features: features ? TERRAIN_FEATURES : [],
        registration: registration
          ? {
              cols: Math.min(9, Math.max(2, Math.round(cssWidth / 150))),
              rows: Math.min(7, Math.max(1, Math.round(cssHeight / 130))),
            }
          : null,
        bounds: TERRAIN_META.bounds,
      })
    }

    paint(0)

    if (motionOn && drift) {
      const span = Math.min(DRIFT_SPAN, Math.max(0, 1 - (viewY + viewH)))
      let origin = 0
      let previous = Number.NEGATIVE_INFINITY
      const step = (now: number): void => {
        raf = requestAnimationFrame(step)
        if (origin === 0) origin = now
        if (now - previous < DRIFT_FRAME_MS) return
        previous = now
        const phase = ((now - origin) % DRIFT_PERIOD_MS) / DRIFT_PERIOD_MS
        paint(span * (0.5 - 0.5 * Math.cos(phase * 2 * Math.PI)))
      }
      raf = requestAnimationFrame(step)
    }

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => paint(0))
        : null
    observer?.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [
    field,
    lines,
    relief,
    features,
    registration,
    drift,
    motionOn,
    viewX,
    viewY,
    viewW,
    viewH,
  ])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="topo-map"
      data-source={source}
      data-field={field?.kind ?? 'pending'}
      className={cn(
        'pointer-events-none absolute inset-0 block h-full w-full',
        className,
      )}
      style={{ opacity }}
    />
  )
}
