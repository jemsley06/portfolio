/* ---------------------------------------------------------------------------
 * topoRender.ts — the drawing math behind `TopoMap`, kept out of the component
 * so it is a pure function of (context, options): no React, no rAF, no DOM
 * lookups. That is what lets it be driven from a script and rasterised for a
 * side-by-side against `references/eva-map-ex.png`.
 *
 * ---------------------------------------------------------------------------
 * WHY PROFILE LINES AND NOT CONTOURS  (PLAN R3)
 *
 * The reference is not an iso-contour map; marching squares draws the wrong
 * picture. Every green line in it is ONE HORIZONTAL SCANLINE across the
 * heightfield, plotted as `y = baseline - height` — a ridgeline plot. Closed
 * loops never appear, lines run edge to edge, they bunch where the ground is
 * steep and spike hard at a summit.
 *
 * The depth in the reference comes entirely from OCCLUSION: rows are drawn
 * back (top) to front (bottom) and each one FILLS the area beneath itself with
 * the ground colour before stroking, so a near ridge hides the far ground
 * behind it. Remove the fill and the image collapses into a plaid of crossing
 * lines.
 * ------------------------------------------------------------------------- */
import type {
  TerrainBounds,
  TerrainFeature,
  TerrainField,
} from '../../lib/terrain'
import { fieldCoordLabel } from '../../lib/terrain'

/** Sub-rectangle of the field to draw, in 0-1 field coordinates. */
export type TopoView = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Resolved colours. Supplied by the component from `--color-*` tokens — this
 * module never names a colour itself.
 */
export type TopoPalette = {
  /** Fill under every profile line. The page ground; this is the occluder. */
  ground: string
  /** Profile lines. */
  line: string
  /** Registration `+` marks and their coordinate tags. */
  mark: string
  /** Named feature splines and their labels. */
  feature: string
  /** `font-family` list for every label. */
  fontFamily: string
}

export type TopoRenderOptions = {
  /** Canvas size in CSS pixels; the caller has already applied `devicePixelRatio`. */
  width: number
  height: number
  field: TerrainField
  view: TopoView
  /** Number of profile lines, far to near. */
  lines: number
  /** Vertical exaggeration multiplier; 1 is the tuned default. */
  relief: number
  palette: TopoPalette
  /** Empty to draw no splines. */
  features: readonly TerrainFeature[]
  /** `null` to draw no `+` marks. */
  registration: { cols: number; rows: number } | null
  /** Geographic bounds the field covers, for the coordinate tags. */
  bounds?: TerrainBounds
  /**
   * Horizontal smoothing of each profile, in FIELD CELLS. A 1-arc-second DEM
   * carries sensor and tree-canopy noise at the 1-2 cell scale, which turns
   * every line into a hairbrush; about one cell of box blur removes it and
   * leaves the landforms. 0 draws the raw samples.
   */
  smoothing?: number
}

/* --- tuning -------------------------------------------------------------- */

/** Baseline of the farthest row, as a fraction of canvas height. */
const FAR_BASELINE = 0.04
/** Baseline of the nearest row. Past 1 so the front row sits off the edge. */
const NEAR_BASELINE = 1.06
/** Peak-to-trough travel of a full-range profile, as a fraction of height. */
const AMPLITUDE = 0.26
/** Nearer rows read slightly taller, which is most of the sense of depth. */
const NEAR_GAIN = 0.28
/** Row spacing eases open towards the viewer (mild, not a perspective grid). */
const SPACING_EASE = 0.18
/** Farthest rows are dimmer; the nearest is full strength. */
const FAR_ALPHA = 0.7

const MIN_SAMPLES = 96
const MAX_SAMPLES = 720
/** Default horizontal smoothing, in field cells. */
const DEFAULT_SMOOTHING = 2
/** Horizontal samples per CSS pixel — 1 sample every ~1.6 px. */
const SAMPLES_PER_PX = 1 / 1.6

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v

/* --- projection ---------------------------------------------------------- */

/**
 * Mean height over the view. Profiles are plotted relative to it, so a window
 * over high ground sits on its baselines instead of floating off the top of
 * the canvas — and a flat window still fills the frame.
 */
function viewDatum(opts: TopoRenderOptions, taps = 12): number {
  const { field, view } = opts
  let sum = 0
  for (let j = 0; j < taps; j++) {
    for (let i = 0; i < taps; i++) {
      sum += field.height(
        view.x + (view.width * (i + 0.5)) / taps,
        view.y + (view.height * (j + 0.5)) / taps,
      )
    }
  }
  return sum / (taps * taps)
}

/**
 * The single mapping from field coordinates to the screen. Both the terrain
 * and the feature splines go through it, which is what makes the red lines
 * drape over the ridges instead of floating on a flat plane.
 */
export function createProjection(opts: TopoRenderOptions) {
  const { width, height, view, field, relief } = opts
  const amplitude = height * AMPLITUDE * relief
  const datum = viewDatum(opts)

  /** `t` runs 0 (far / top) to 1 (near / bottom). */
  const baselineFor = (t: number): number => {
    const eased = t * (1 - SPACING_EASE) + t * t * SPACING_EASE
    return height * (FAR_BASELINE + (NEAR_BASELINE - FAR_BASELINE) * eased)
  }
  const gainFor = (t: number): number =>
    amplitude * (1 - NEAR_GAIN / 2 + NEAR_GAIN * t)

  return {
    datum,
    baselineFor,
    gainFor,
    /** Screen x of a field column. */
    screenX: (fx: number): number =>
      view.width === 0 ? 0 : ((fx - view.x) / view.width) * width,
    /** Screen y of a height reading on row `t`. */
    plot: (t: number, h: number): number =>
      baselineFor(t) - (h - datum) * gainFor(t),
    /** Screen y of a point on the terrain surface, smoothed like the profiles. */
    screenY: (fx: number, fy: number): number => {
      const t = view.height === 0 ? 0 : (fy - view.y) / view.height
      const step = (opts.smoothing ?? DEFAULT_SMOOTHING) / field.resolution
      const h =
        step <= 0
          ? field.height(fx, fy)
          : (field.height(fx - step, fy) +
              field.height(fx, fy) +
              field.height(fx + step, fy)) /
            3
      return baselineFor(t) - (h - datum) * gainFor(t)
    },
  }
}

/** In-place box blur of one sampled profile, `radius` samples either side. */
function blurRow(row: Float64Array, radius: number): void {
  if (radius < 1) return
  const n = row.length
  const src = Float64Array.from(row)
  const window = radius * 2 + 1
  for (let i = 0; i < n; i++) {
    let sum = 0
    for (let d = -radius; d <= radius; d++) {
      sum += src[Math.min(n - 1, Math.max(0, i + d))]
    }
    row[i] = sum / window
  }
}

/* --- splines ------------------------------------------------------------- */

/**
 * Centripetal-ish Catmull-Rom through the waypoints, evaluated in FIELD space
 * so the curve is smooth on the ground rather than smooth on the screen.
 */
export function catmullRom(
  points: ReadonlyArray<readonly [number, number]>,
  perSegment = 8,
): Array<readonly [number, number]> {
  if (points.length < 2) return points.map((p) => p)

  const out: Array<readonly [number, number]> = []
  const at = (i: number): readonly [number, number] =>
    points[clamp(i, 0, points.length - 1)]

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment
      const t2 = t * t
      const t3 = t2 * t
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  out.push(points[points.length - 1])
  return out
}

/* --- passes -------------------------------------------------------------- */

function drawProfiles(
  ctx: CanvasRenderingContext2D,
  opts: TopoRenderOptions,
  proj: ReturnType<typeof createProjection>,
): void {
  const { width, height, view, field, lines, palette } = opts

  const samples = Math.round(
    clamp(width * SAMPLES_PER_PX, MIN_SAMPLES, MAX_SAMPLES),
  )
  // Samples per field cell across the view → blur radius in samples.
  const perCell = samples / Math.max(1, view.width * field.resolution)
  const radius = Math.round(
    ((opts.smoothing ?? DEFAULT_SMOOTHING) * perCell) / 2,
  )

  const row = new Float64Array(samples + 1)
  const xs = new Float64Array(samples + 1)
  const ys = new Float64Array(samples + 1)
  for (let s = 0; s <= samples; s++) xs[s] = (s / samples) * width

  for (let i = 0; i < lines; i++) {
    const t = lines === 1 ? 0 : i / (lines - 1)
    const fy = view.y + view.height * t

    for (let s = 0; s <= samples; s++) {
      row[s] = field.height(view.x + (view.width * s) / samples, fy)
    }
    blurRow(row, radius)
    for (let s = 0; s <= samples; s++) ys[s] = proj.plot(t, row[s])

    // Pass 1 — the occluder. Everything drawn earlier (farther) that falls
    // below this profile is painted out, which is where the depth comes from.
    ctx.beginPath()
    ctx.moveTo(xs[0], ys[0])
    for (let s = 1; s <= samples; s++) ctx.lineTo(xs[s], ys[s])
    ctx.lineTo(width, height + 2)
    ctx.lineTo(0, height + 2)
    ctx.closePath()
    ctx.globalAlpha = 1
    ctx.fillStyle = palette.ground
    ctx.fill()

    // Pass 2 — the ridge itself.
    ctx.beginPath()
    ctx.moveTo(xs[0], ys[0])
    for (let s = 1; s <= samples; s++) ctx.lineTo(xs[s], ys[s])
    ctx.globalAlpha = FAR_ALPHA + (1 - FAR_ALPHA) * t
    ctx.strokeStyle = palette.line
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawRegistration(
  ctx: CanvasRenderingContext2D,
  opts: TopoRenderOptions,
): void {
  const grid = opts.registration
  if (!grid) return

  const { width, height, view, palette, bounds } = opts
  const arm = 5
  const fontPx = 8

  ctx.strokeStyle = palette.mark
  ctx.fillStyle = palette.mark
  ctx.lineWidth = 1
  ctx.font = `${fontPx}px ${palette.fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const x = Math.round((width * (col + 0.5)) / grid.cols) + 0.5
      const y = Math.round((height * (row + 0.5)) / grid.rows) + 0.5

      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.moveTo(x - arm, y)
      ctx.lineTo(x + arm, y)
      ctx.moveTo(x, y - arm)
      ctx.lineTo(x, y + arm)
      ctx.stroke()

      // Every other mark carries the real coordinate under the cross-hair.
      if (bounds && (row + col) % 2 === 0) {
        ctx.globalAlpha = 0.22
        ctx.fillText(
          fieldCoordLabel(
            view.x + (view.width * (col + 0.5)) / grid.cols,
            view.y + (view.height * (row + 0.5)) / grid.rows,
            bounds,
          ),
          x + arm + 2,
          y - fontPx / 2,
        )
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawFeatures(
  ctx: CanvasRenderingContext2D,
  opts: TopoRenderOptions,
  proj: ReturnType<typeof createProjection>,
): void {
  const { width, height, palette, features } = opts
  if (features.length === 0) return

  const fontPx = 9
  ctx.lineWidth = 1.4
  ctx.lineJoin = 'round'
  ctx.font = `${fontPx}px ${palette.fontFamily}`
  ctx.textBaseline = 'middle'

  for (const feature of features) {
    const curve = catmullRom(feature.points)
    const screen = curve.map(
      ([fx, fy]) => [proj.screenX(fx), proj.screenY(fx, fy)] as const,
    )
    if (screen.length < 2) continue

    ctx.globalAlpha = 0.85
    ctx.strokeStyle = palette.feature
    ctx.beginPath()
    ctx.moveTo(screen[0][0], screen[0][1])
    for (let i = 1; i < screen.length; i++) {
      ctx.lineTo(screen[i][0], screen[i][1])
    }
    ctx.stroke()

    // Label where the spline enters and leaves the frame, not at its raw
    // endpoints — a cropped view would otherwise lose both labels.
    const onScreen = (p: readonly [number, number]): boolean =>
      p[0] >= 0 && p[0] <= width && p[1] >= 0 && p[1] <= height
    const first = screen.findIndex(onScreen)
    if (first < 0) continue
    let last = screen.length - 1
    while (last > first && !onScreen(screen[last])) last--

    ctx.globalAlpha = 1
    ctx.fillStyle = palette.feature
    for (const [end, point] of [
      [0, screen[first]] as const,
      [1, screen[last]] as const,
    ]) {
      const [x, y] = point
      const pastMiddle = x > width / 2
      ctx.textAlign = pastMiddle ? 'right' : 'left'
      ctx.fillText(
        feature.label,
        clamp(x + (pastMiddle ? -6 : 6), 4, width - 4),
        clamp(y + (end === 0 ? -8 : 10), fontPx, height - fontPx),
      )
    }
  }
  ctx.globalAlpha = 1
}

/* --- entry point --------------------------------------------------------- */

/** Paints one complete frame. Leaves no state on `ctx` that a caller relies on. */
export function drawTopoMap(
  ctx: CanvasRenderingContext2D,
  opts: TopoRenderOptions,
): void {
  const proj = createProjection(opts)

  ctx.globalAlpha = 1
  ctx.fillStyle = opts.palette.ground
  ctx.fillRect(0, 0, opts.width, opts.height)

  drawProfiles(ctx, opts, proj)
  drawRegistration(ctx, opts)
  drawFeatures(ctx, opts, proj)
}
