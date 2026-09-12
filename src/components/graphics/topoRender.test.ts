import { describe, expect, it } from 'vitest'
import {
  catmullRom,
  createProjection,
  drawTopoMap,
  type TopoRenderOptions,
} from './topoRender'
import { TERRAIN_META, createFallbackField } from '../../lib/terrain'

type Call = { op: string; style: string; points: Array<[number, number]> }

/** A recording 2d context: canvas output is stubbed in jsdom, so assert on the
 *  call pattern instead. This is also the contract R3 cares about — fill under
 *  every profile, back to front. */
function recorder() {
  const calls: Call[] = []
  let points: Array<[number, number]> = []
  const state = { fillStyle: '', strokeStyle: '' }
  const ctx = {
    ...state,
    globalAlpha: 1,
    lineWidth: 1,
    lineJoin: 'miter',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillRect: () =>
      calls.push({ op: 'fillRect', style: ctx.fillStyle, points: [] }),
    beginPath: () => {
      points = []
    },
    moveTo: (x: number, y: number) => points.push([x, y]),
    lineTo: (x: number, y: number) => points.push([x, y]),
    closePath: () => {},
    fill: () =>
      calls.push({ op: 'fill', style: ctx.fillStyle, points: [...points] }),
    stroke: () =>
      calls.push({ op: 'stroke', style: ctx.strokeStyle, points: [...points] }),
    fillText: (text: string) =>
      calls.push({ op: `text:${text}`, style: ctx.fillStyle, points: [] }),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

const palette = {
  ground: 'GROUND',
  line: 'LINE',
  mark: 'MARK',
  feature: 'FEATURE',
  fontFamily: 'mono',
}

function options(
  overrides: Partial<TopoRenderOptions> = {},
): TopoRenderOptions {
  return {
    width: 400,
    height: 300,
    field: createFallbackField(1),
    view: { x: 0, y: 0, width: 1, height: 1 },
    lines: 12,
    relief: 1,
    palette,
    features: [],
    registration: null,
    bounds: TERRAIN_META.bounds,
    ...overrides,
  }
}

describe('drawTopoMap — profile lines', () => {
  it('clears to the ground colour, then draws one fill + one stroke per line', () => {
    const { ctx, calls } = recorder()
    drawTopoMap(ctx, options({ lines: 12 }))

    expect(calls[0].op).toBe('fillRect')
    expect(calls[0].style).toBe('GROUND')
    expect(
      calls.filter((c) => c.op === 'fill' && c.style === 'GROUND'),
    ).toHaveLength(12)
    expect(
      calls.filter((c) => c.op === 'stroke' && c.style === 'LINE'),
    ).toHaveLength(12)
  })

  it('fills BEFORE it strokes each line — the fill is the occluder', () => {
    const { ctx, calls } = recorder()
    drawTopoMap(ctx, options({ lines: 4 }))

    const sequence = calls
      .filter((c) => c.op === 'fill' || c.op === 'stroke')
      .map((c) => c.op)
    expect(sequence).toEqual([
      'fill',
      'stroke',
      'fill',
      'stroke',
      'fill',
      'stroke',
      'fill',
      'stroke',
    ])
  })

  it('closes each fill below the canvas so it hides everything behind it', () => {
    const { ctx, calls } = recorder()
    const opts = options({ lines: 3 })
    drawTopoMap(ctx, opts)

    for (const fill of calls.filter((c) => c.op === 'fill')) {
      expect(fill.points.at(-1)?.[0]).toBe(0)
      expect(fill.points.at(-1)?.[1]).toBeGreaterThan(opts.height)
      expect(fill.points.at(-2)?.[0]).toBe(opts.width)
      expect(fill.points.at(-2)?.[1]).toBeGreaterThan(opts.height)
    }
  })

  it('draws back to front — each baseline is nearer than the last', () => {
    const opts = options({ lines: 10 })
    const proj = createProjection(opts)
    const baselines = Array.from({ length: 10 }, (_, i) =>
      proj.baselineFor(i / 9),
    )
    for (let i = 1; i < baselines.length; i++) {
      expect(baselines[i]).toBeGreaterThan(baselines[i - 1])
    }
  })

  it('runs every line edge to edge — no closed contour loops', () => {
    const { ctx, calls } = recorder()
    const opts = options({ lines: 6 })
    drawTopoMap(ctx, opts)

    for (const stroke of calls.filter((c) => c.op === 'stroke')) {
      expect(stroke.points[0][0]).toBe(0)
      expect(stroke.points.at(-1)?.[0]).toBeCloseTo(opts.width, 6)
    }
  })
})

describe('drawTopoMap — overlays', () => {
  it('draws nothing extra when features and registration are off', () => {
    const { ctx, calls } = recorder()
    drawTopoMap(ctx, options())

    expect(calls.some((c) => c.style === 'MARK')).toBe(false)
    expect(calls.some((c) => c.style === 'FEATURE')).toBe(false)
  })

  it('labels each spline from the data, at both ends, over the terrain', () => {
    const { ctx, calls } = recorder()
    drawTopoMap(
      ctx,
      options({
        features: [
          {
            id: 'sr-26',
            label: 'SR-26',
            points: [
              [0, 0.5],
              [0.5, 0.52],
              [1, 0.5],
            ],
          },
        ],
      }),
    )

    expect(calls.filter((c) => c.op === 'text:SR-26')).toHaveLength(2)
    const splineIndex = calls.findIndex(
      (c) => c.op === 'stroke' && c.style === 'FEATURE',
    )
    const lastTerrain = calls.map((c) => c.style).lastIndexOf('LINE')
    expect(splineIndex).toBeGreaterThan(lastTerrain)
  })

  it('draws a + per registration cell with a coordinate tag on half of them', () => {
    const { ctx, calls } = recorder()
    drawTopoMap(ctx, options({ registration: { cols: 4, rows: 2 } }))

    expect(
      calls.filter((c) => c.op === 'stroke' && c.style === 'MARK'),
    ).toHaveLength(8)
    const tags = calls.filter((c) => c.op.startsWith('text:4'))
    expect(tags).toHaveLength(4)
    expect(tags[0].op).toMatch(/^text:40\.\d{3}N 86\.\d{3}W$/)
  })
})

describe('createProjection', () => {
  it('drapes a point over the terrain instead of onto a flat plane', () => {
    const field = createFallbackField(1, [
      { x: 0.5, y: 0.5, h: 0.9, sigma: 0.05 },
    ])
    const proj = createProjection(options({ field }))

    // A point on the summit is drawn higher up the canvas than its baseline.
    expect(proj.screenY(0.5, 0.5)).toBeLessThan(proj.baselineFor(0.5))
  })

  it('maps the view rectangle across the full canvas width', () => {
    const proj = createProjection(
      options({ view: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } }),
    )
    expect(proj.screenX(0.25)).toBeCloseTo(0, 6)
    expect(proj.screenX(0.75)).toBeCloseTo(400, 6)
  })
})

describe('catmullRom', () => {
  it('passes through every waypoint it is given', () => {
    const points: Array<readonly [number, number]> = [
      [0, 0],
      [0.3, 0.6],
      [0.7, 0.2],
      [1, 1],
    ]
    const curve = catmullRom(points, 8)

    for (const point of points) {
      expect(
        curve.some(
          (c) =>
            Math.abs(c[0] - point[0]) < 1e-9 &&
            Math.abs(c[1] - point[1]) < 1e-9,
        ),
      ).toBe(true)
    }
    expect(curve.length).toBeGreaterThan(points.length)
  })

  it('returns a degenerate input untouched', () => {
    expect(catmullRom([])).toEqual([])
    expect(catmullRom([[0.5, 0.5]])).toEqual([[0.5, 0.5]])
  })
})
