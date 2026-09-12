/* ---------------------------------------------------------------------------
 * terrain.ts — the heightfield and the named features `TopoMap` draws.
 *
 * PLAN R4: the map depicts real ground — a 15 km window centred on Purdue's
 * campus in West Lafayette, Indiana, where the Wabash valley cuts 40-60 m
 * below the till plain. The elevation itself is baked at BUILD time by
 * `scripts/bake-terrain.mjs` (source + licence documented there: USGS 3DEP /
 * NASA SRTM, public domain) into two committed artefacts:
 *
 *   public/terrain/west-lafayette-256.u8   65 536 raw bytes, fetched at run
 *                                          time as a static file so it never
 *                                          counts against the JS budget
 *   src/lib/terrain.generated.ts           typed metadata + the DEM-traced
 *                                          Wabash thalweg
 *
 * Nothing here ever calls an API: the asset is a file next to `index.html`.
 * If it is missing — or the fetch fails, or a page asks for invented ground —
 * `createFallbackField()` supplies procedural noise instead, and the caller
 * can tell which it got from `TerrainField.kind`.
 * ------------------------------------------------------------------------- */
import { createProceduralHeight, type Peak } from './noise'
import { TERRAIN_META, WABASH_THALWEG } from './terrain.generated'

/* --- types --------------------------------------------------------------- */

export type TerrainBounds = {
  north: number
  south: number
  west: number
  east: number
}

/** Shape of the generated module. Written by `scripts/bake-terrain.mjs`. */
export type TerrainMeta = {
  /** Public path of the raw byte grid, relative to the site root. */
  assetUrl: string
  /** Grid is `size` x `size`, row 0 north, column 0 west. */
  size: number
  /** Expected byte length — a cheap integrity check on the fetched asset. */
  bytes: number
  sha256: string
  bounds: TerrainBounds
  /** Metres above sea level that byte 0 and byte 255 stand for. */
  minElevation: number
  maxElevation: number
  /** Human label, e.g. for a `MetaBlock` row next to the map. */
  place: string
  spanKm: number
}

/** Height in [0, 1] at field coordinates x, y in [0, 1]; y = 0 is north. */
export type HeightSampler = (x: number, y: number) => number

export type TerrainField = {
  kind: 'baked' | 'procedural'
  height: HeightSampler
  /** Grid cells across the field — how finely it is worth sampling. */
  resolution: number
}

/**
 * A named line across the map, in FIELD coordinates (0-1, y = 0 north), so
 * `TopoMap` can drape it over the terrain without knowing about longitude.
 */
export type TerrainFeature = {
  id: string
  /** Drawn in mono at both ends of the spline. */
  label: string
  points: ReadonlyArray<readonly [number, number]>
}

export { TERRAIN_META }

/* --- sampling ------------------------------------------------------------ */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

function bilinear(data: Uint8Array, size: number): HeightSampler {
  return (x, y) => {
    const fx = clamp01(x) * (size - 1)
    const fy = clamp01(y) * (size - 1)
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const x1 = Math.min(size - 1, x0 + 1)
    const y1 = Math.min(size - 1, y0 + 1)
    const tx = fx - x0
    const ty = fy - y0
    const top = data[y0 * size + x0] * (1 - tx) + data[y0 * size + x1] * tx
    const bot = data[y1 * size + x0] * (1 - tx) + data[y1 * size + x1] * tx
    return (top * (1 - ty) + bot * ty) / 255
  }
}

/* --- baked field --------------------------------------------------------- */

let bakedRequest: Promise<TerrainField | null> | null = null

async function requestBakedTerrain(): Promise<TerrainField | null> {
  if (typeof fetch !== 'function') return null
  try {
    const res = await fetch(TERRAIN_META.assetUrl)
    if (!res.ok) return null
    const data = new Uint8Array(await res.arrayBuffer())
    if (data.byteLength !== TERRAIN_META.bytes) return null
    return {
      kind: 'baked',
      height: bilinear(data, TERRAIN_META.size),
      resolution: TERRAIN_META.size,
    }
  } catch {
    /* Offline, blocked, or the asset was never baked — the caller falls back. */
    return null
  }
}

/**
 * Fetches the committed heightfield once per document and shares the result
 * with every `TopoMap` on the page. Resolves `null` when the asset is absent
 * or malformed; it never throws and never blocks a first paint.
 */
export function loadBakedTerrain(): Promise<TerrainField | null> {
  bakedRequest ??= requestBakedTerrain()
  return bakedRequest
}

/** Test seam: forget the in-flight/completed request. */
export function resetBakedTerrainCache(): void {
  bakedRequest = null
}

/* --- procedural field ---------------------------------------------------- */

/** The sharp summit of `references/eva-map-ex.png`, just left of centre. */
export const DEFAULT_PEAKS: readonly Peak[] = [
  { x: 0.5, y: 0.45, h: 0.86, sigma: 0.024 },
  { x: 0.47, y: 0.47, h: 0.3, sigma: 0.13 },
]

export function createFallbackField(
  seed = 7,
  peaks: readonly Peak[] = DEFAULT_PEAKS,
): TerrainField {
  return {
    kind: 'procedural',
    height: createProceduralHeight({
      seed,
      peaks,
      octaves: 4,
      frequency: 5.5,
    }),
    // Value noise is already band-limited, so tell the renderer its "cells"
    // are small and it should barely blur: there is no sensor noise to remove.
    resolution: 512,
  }
}

/* --- named features ------------------------------------------------------ */

/**
 * Longitude/latitude → field coordinates of the baked window. Values outside
 * the window come back outside [0, 1]; `TopoMap` clips them at the edge.
 */
export function toFieldCoords(
  lon: number,
  lat: number,
  bounds: TerrainBounds = TERRAIN_META.bounds,
): readonly [number, number] {
  return [
    (lon - bounds.west) / (bounds.east - bounds.west),
    (bounds.north - lat) / (bounds.north - bounds.south),
  ]
}

/* ---------------------------------------------------------------------------
 * Road alignments.
 *
 * The Wabash comes out of the elevation data itself (see WABASH_THALWEG in the
 * generated module). Roads cannot: they are not a landform. The two below are
 * hand-digitised approximations of real alignments — SR-26 running east-west
 * through West Lafayette and Lafayette, US-231 running north-south on the
 * bypass around the west and south of the city — placed to a few hundred
 * metres, which is all a decorative background at 25-40% opacity can show.
 *
 * They are typed here as plain coordinates rather than pulled from OpenStreetMap
 * or any other vector service, precisely so the repository carries no dataset
 * licence or attribution obligation it has not honoured (PLAN R4).
 * ------------------------------------------------------------------------- */
const SR_26: ReadonlyArray<readonly [number, number]> = [
  [-87.0097, 40.4246],
  [-86.99, 40.4246],
  [-86.97, 40.4243],
  [-86.95, 40.424],
  [-86.935, 40.4237],
  [-86.9212, 40.4232],
  [-86.908, 40.4225],
  [-86.9, 40.4198],
  [-86.8955, 40.4175],
  [-86.888, 40.416],
  [-86.875, 40.4152],
  [-86.86, 40.415],
  [-86.8327, 40.4148],
]

const US_231: ReadonlyArray<readonly [number, number]> = [
  [-86.956, 40.4912],
  [-86.957, 40.475],
  [-86.96, 40.457],
  [-86.962, 40.44],
  [-86.9625, 40.424],
  [-86.96, 40.41],
  [-86.952, 40.396],
  [-86.943, 40.387],
  [-86.928, 40.379],
  [-86.91, 40.37],
  [-86.89, 40.3562],
]

function toFeature(
  id: string,
  label: string,
  points: ReadonlyArray<readonly [number, number]>,
): TerrainFeature {
  return {
    id,
    label,
    points: points.map(([lon, lat]) => toFieldCoords(lon, lat)),
  }
}

/**
 * The red splines `TopoMap` draws across the field, in draw order. Drawn over
 * procedural terrain too: they are the same three lines, draped over whatever
 * ground the component was given.
 */
export const TERRAIN_FEATURES: readonly TerrainFeature[] = [
  toFeature('wabash', 'WABASH', WABASH_THALWEG),
  toFeature('sr-26', 'SR-26', SR_26),
  toFeature('us-231', 'US-231', US_231),
]

/* --- registration marks -------------------------------------------------- */

/** Latitude/longitude of a grid position, for the `+` marks' coordinate tags. */
export function fieldCoordLabel(
  x: number,
  y: number,
  bounds: TerrainBounds = TERRAIN_META.bounds,
): string {
  const lat = bounds.north - (bounds.north - bounds.south) * y
  const lon = bounds.west + (bounds.east - bounds.west) * x
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(3)}${ns} ${Math.abs(lon).toFixed(3)}${ew}`
}
