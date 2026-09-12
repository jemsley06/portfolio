import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TERRAIN_FEATURES,
  TERRAIN_META,
  createFallbackField,
  fieldCoordLabel,
  loadBakedTerrain,
  resetBakedTerrainCache,
  toFieldCoords,
} from './terrain'

afterEach(() => {
  resetBakedTerrainCache()
  vi.unstubAllGlobals()
})

describe('the committed terrain asset', () => {
  it('matches the metadata the bake script emitted', async () => {
    const bytes = await readFile(`public${TERRAIN_META.assetUrl}`)

    expect(bytes.byteLength).toBe(TERRAIN_META.bytes)
    expect(bytes.byteLength).toBe(TERRAIN_META.size * TERRAIN_META.size)
    expect(createHash('sha256').update(bytes).digest('hex')).toMatch(
      new RegExp(`^${TERRAIN_META.sha256}`),
    )
  })

  it('describes a real 15 km window over West Lafayette', () => {
    const { bounds, spanKm, minElevation, maxElevation } = TERRAIN_META
    expect(spanKm).toBe(15)
    expect(bounds.north).toBeGreaterThan(bounds.south)
    expect(bounds.east).toBeGreaterThan(bounds.west)
    // Purdue's campus core sits inside the window.
    expect(40.4237).toBeGreaterThan(bounds.south)
    expect(40.4237).toBeLessThan(bounds.north)
    expect(-86.9212).toBeGreaterThan(bounds.west)
    expect(-86.9212).toBeLessThan(bounds.east)
    // The Wabash valley's 40-60 m of relief is the whole reason for the window.
    expect(maxElevation - minElevation).toBeGreaterThan(40)
  })
})

describe('loadBakedTerrain', () => {
  it('resolves a baked field from the static asset', async () => {
    const bytes = await readFile(`public${TERRAIN_META.assetUrl}`)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () =>
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
    })
    vi.stubGlobal('fetch', fetchMock)

    const field = await loadBakedTerrain()

    expect(fetchMock).toHaveBeenCalledWith(TERRAIN_META.assetUrl)
    expect(field?.kind).toBe('baked')
    expect(field?.resolution).toBe(TERRAIN_META.size)
    expect(field?.height(0.5, 0.5)).toBeGreaterThanOrEqual(0)
    expect(field?.height(0.5, 0.5)).toBeLessThanOrEqual(1)
  })

  it('only fetches once however many maps ask for it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    await Promise.all([loadBakedTerrain(), loadBakedTerrain()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resolves null instead of throwing when the asset is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(loadBakedTerrain()).resolves.toBeNull()
  })

  it('rejects an asset of the wrong length rather than drawing garbage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(16),
      }),
    )
    await expect(loadBakedTerrain()).resolves.toBeNull()
  })
})

describe('createFallbackField', () => {
  it('is procedural, deterministic and bounded', () => {
    const a = createFallbackField(3)
    const b = createFallbackField(3)
    expect(a.kind).toBe('procedural')
    for (let i = 0; i <= 10; i++) {
      const v = a.height(i / 10, 0.5)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      expect(v).toBe(b.height(i / 10, 0.5))
    }
  })

  it('gives a different landscape per seed', () => {
    expect(createFallbackField(1).height(0.2, 0.8)).not.toBe(
      createFallbackField(2).height(0.2, 0.8),
    )
  })
})

describe('named features', () => {
  it('carries the three real ones, labelled from the data', () => {
    expect(TERRAIN_FEATURES.map((f) => f.label)).toEqual([
      'WABASH',
      'SR-26',
      'US-231',
    ])
  })

  it('projects every waypoint into the window', () => {
    for (const feature of TERRAIN_FEATURES) {
      expect(feature.points.length).toBeGreaterThan(4)
      for (const [x, y] of feature.points) {
        expect(x).toBeGreaterThanOrEqual(-0.01)
        expect(x).toBeLessThanOrEqual(1.01)
        expect(y).toBeGreaterThanOrEqual(-0.01)
        expect(y).toBeLessThanOrEqual(1.01)
      }
    }
  })

  it('runs the Wabash north-east to west, the way the river does', () => {
    const wabash = TERRAIN_FEATURES[0]
    const first = wabash.points[0]
    const last = wabash.points[wabash.points.length - 1]
    expect(Math.abs(first[0] - last[0])).toBeGreaterThan(0.4)
    expect(Math.abs(first[1] - last[1])).toBeGreaterThan(0.3)
  })
})

describe('toFieldCoords / fieldCoordLabel', () => {
  it('maps the window corners to the unit square, north at y = 0', () => {
    const { bounds } = TERRAIN_META
    expect(toFieldCoords(bounds.west, bounds.north)[0]).toBeCloseTo(0, 6)
    expect(toFieldCoords(bounds.west, bounds.north)[1]).toBeCloseTo(0, 6)
    expect(toFieldCoords(bounds.east, bounds.south)[0]).toBeCloseTo(1, 6)
    expect(toFieldCoords(bounds.east, bounds.south)[1]).toBeCloseTo(1, 6)
  })

  it('labels a field position with its real coordinates', () => {
    expect(fieldCoordLabel(0.5, 0.5)).toMatch(/^40\.\d{3}N 86\.\d{3}W$/)
  })
})
