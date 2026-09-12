/* ---------------------------------------------------------------------------
 * bake-terrain.mjs — BUILD-TIME ONLY. Bakes a real elevation heightfield for
 * `TopoMap` (PLAN R4) and commits it, so `pnpm build` never touches the
 * network and the deploy stays a pile of static files.
 *
 *   pnpm bake:terrain            # uses scripts/.cache when populated
 *   pnpm bake:terrain --refresh  # ignores the cache and re-downloads
 *
 * ---------------------------------------------------------------------------
 * SOURCE AND LICENCE
 *
 * Elevation comes from the "Terrain Tiles" public dataset on the AWS Open Data
 * registry (https://registry.opendata.aws/terrain-tiles/), read through its
 * `skadi` endpoint, which serves gzipped SRTM-format `.hgt` tiles:
 *
 *   https://s3.amazonaws.com/elevation-tiles-prod/skadi/N40/N40W087.hgt.gz
 *
 * Over the continental United States — the only ground this bake touches — the
 * underlying measurements are the U.S. Geological Survey's National Elevation
 * Dataset / 3D Elevation Program (3DEP) and NASA/USGS SRTM. Both are works of
 * the U.S. federal government and are in the PUBLIC DOMAIN: no attribution is
 * required and redistribution of the derived heightfield is unrestricted. The
 * AWS bucket is a redistribution channel, not a rights holder, and imposes no
 * further terms (the dataset's non-public-domain contributors — Canada's CDEM,
 * New Zealand LINZ and similar — cover ground outside this window and are
 * never fetched here).
 *
 * Deliberately NOT used: any raster/vector tile service whose terms forbid
 * redistributing derived data, and any source that would oblige us to ship an
 * attribution notice we have not written.
 *
 * ---------------------------------------------------------------------------
 * WINDOW  (PLAN R4: "roughly 15 km across, centred on campus")
 *
 * Centre 40.4237 N, 86.9212 W — Purdue University's campus core, West
 * Lafayette, Indiana. 15 km square, so the frame holds the Wabash River
 * valley, which cuts 40-60 m below the surrounding till plain and supplies the
 * bunched, steep line runs the reference map lives on.
 *
 * ---------------------------------------------------------------------------
 * OUTPUTS (both committed)
 *
 *   public/terrain/west-lafayette-256.u8   65 536 raw bytes: a 256x256 grid of
 *                                          elevations quantised to 0-255 over
 *                                          [minElevation, maxElevation], row 0
 *                                          north, column 0 west. No header —
 *                                          the shape lives in the typed module
 *                                          below. Fetched at runtime as a
 *                                          static file so it never enters the
 *                                          JS bundle budget.
 *   src/lib/terrain.generated.ts           typed metadata + the Wabash thalweg
 *                                          traced out of this very heightfield.
 * ------------------------------------------------------------------------- */
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CACHE_DIR = join(HERE, '.cache')
const BIN_OUT = join(ROOT, 'public', 'terrain', 'west-lafayette-256.u8')
const TS_OUT = join(ROOT, 'src', 'lib', 'terrain.generated.ts')

/** Public asset path the browser fetches. Mirrored in the generated module. */
const ASSET_URL = '/terrain/west-lafayette-256.u8'

const CENTER_LAT = 40.4237
const CENTER_LON = -86.9212
const SPAN_KM = 15
const SIZE = 256

/** SRTM 1-arc-second tiles are 3601x3601 int16 big-endian, void = -32768. */
const HGT_DIM = 3601
const HGT_VOID = -32768
const SKADI_BASE = 'https://s3.amazonaws.com/elevation-tiles-prod/skadi'

/* --- geometry ------------------------------------------------------------ */

const M_PER_DEG_LAT = 111_132
const metresPerDegLon = (lat) => 111_320 * Math.cos((lat * Math.PI) / 180)

function windowBounds() {
  const halfLat = (SPAN_KM * 1000) / 2 / M_PER_DEG_LAT
  const halfLon = (SPAN_KM * 1000) / 2 / metresPerDegLon(CENTER_LAT)
  return {
    north: CENTER_LAT + halfLat,
    south: CENTER_LAT - halfLat,
    west: CENTER_LON - halfLon,
    east: CENTER_LON + halfLon,
  }
}

/* --- tile fetching ------------------------------------------------------- */

function tileName(latFloor, lonFloor) {
  const ns = latFloor >= 0 ? 'N' : 'S'
  const ew = lonFloor >= 0 ? 'E' : 'W'
  const la = String(Math.abs(latFloor)).padStart(2, '0')
  const lo = String(Math.abs(lonFloor)).padStart(3, '0')
  return `${ns}${la}${ew}${lo}`
}

async function fetchTile(latFloor, lonFloor, refresh) {
  const name = tileName(latFloor, lonFloor)
  const cached = join(CACHE_DIR, `${name}.hgt.gz`)

  if (!refresh && existsSync(cached)) {
    process.stdout.write(`  ${name}  cache\n`)
    return gunzipSync(await readFile(cached))
  }

  const url = `${SKADI_BASE}/${name.slice(0, 3)}/${name}.hgt.gz`
  process.stdout.write(`  ${name}  GET ${url}\n`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `elevation fetch failed: ${res.status} ${res.statusText} for ${url}\n` +
        'No network? Populate scripts/.cache/ with the .hgt.gz tiles, or run ' +
        'this script where s3.amazonaws.com is reachable. Do NOT hand-edit ' +
        'the baked asset — TopoMap has a procedural fallback for exactly this.',
    )
  }
  const gz = Buffer.from(await res.arrayBuffer())
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(cached, gz)
  return gunzipSync(gz)
}

/** Mosaic of every 1x1 degree tile the window touches. */
async function loadMosaic(bounds, refresh) {
  const tiles = new Map()
  for (
    let lat = Math.floor(bounds.south);
    lat <= Math.floor(bounds.north);
    lat++
  ) {
    for (
      let lon = Math.floor(bounds.west);
      lon <= Math.floor(bounds.east);
      lon++
    ) {
      const buf = await fetchTile(lat, lon, refresh)
      if (buf.length !== HGT_DIM * HGT_DIM * 2) {
        throw new Error(
          `unexpected tile size ${buf.length} for ${tileName(lat, lon)}`,
        )
      }
      tiles.set(`${lat}/${lon}`, buf)
    }
  }

  /** Nearest-sample elevation in metres at (lat, lon), or null over a void. */
  return function elevationAt(lat, lon) {
    const latFloor = Math.floor(lat)
    const lonFloor = Math.floor(lon)
    const buf = tiles.get(`${latFloor}/${lonFloor}`)
    if (!buf) return null
    // Row 0 is the tile's NORTH edge; column 0 its WEST edge. Both edges are
    // shared with the neighbouring tile, hence 3601 rather than 3600.
    const row = (latFloor + 1 - lat) * (HGT_DIM - 1)
    const col = (lon - lonFloor) * (HGT_DIM - 1)
    const r = Math.min(HGT_DIM - 1, Math.max(0, Math.round(row)))
    const c = Math.min(HGT_DIM - 1, Math.max(0, Math.round(col)))
    const v = buf.readInt16BE((r * HGT_DIM + c) * 2)
    return v === HGT_VOID ? null : v
  }
}

/* --- sampling ------------------------------------------------------------ */

/** Box-averaged sample of the mosaic over the window into a SIZE x SIZE grid. */
function sampleGrid(elevationAt, bounds) {
  const out = new Float64Array(SIZE * SIZE)
  let voids = 0

  for (let y = 0; y < SIZE; y++) {
    const lat = bounds.north - ((bounds.north - bounds.south) * y) / (SIZE - 1)
    for (let x = 0; x < SIZE; x++) {
      const lon = bounds.west + ((bounds.east - bounds.west) * x) / (SIZE - 1)
      // Average the 1-arc-second neighbourhood so 256 samples over 15 km keep
      // the valley walls instead of aliasing them into steps.
      const step = 1 / 3600 / 2
      let sum = 0
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = elevationAt(lat + dy * step, lon + dx * step)
          if (v !== null) {
            sum += v
            n++
          }
        }
      }
      if (n === 0) {
        voids++
        out[y * SIZE + x] = Number.NaN
      } else {
        out[y * SIZE + x] = sum / n
      }
    }
  }

  if (voids > 0) {
    throw new Error(
      `${voids} sample(s) fell in a data void — refusing to bake a patched ` +
        'heightfield. Pick a different window or source.',
    )
  }
  return out
}

/* --- Wabash thalweg ------------------------------------------------------ */

/** Separable box blur, `radius` cells, edge-clamped. */
function smooth(grid, radius) {
  const tmp = new Float64Array(SIZE * SIZE)
  const out = new Float64Array(SIZE * SIZE)
  const clamp = (v) => Math.min(SIZE - 1, Math.max(0, v))
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let sum = 0
      for (let d = -radius; d <= radius; d++) {
        sum += grid[y * SIZE + clamp(x + d)]
      }
      tmp[y * SIZE + x] = sum / (radius * 2 + 1)
    }
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let sum = 0
      for (let d = -radius; d <= radius; d++) {
        sum += tmp[clamp(y + d) * SIZE + x]
      }
      out[y * SIZE + x] = sum / (radius * 2 + 1)
    }
  }
  return out
}

/**
 * Traces the Wabash's valley floor out of the baked heightfield rather than
 * importing anyone's river vector data.
 *
 * Dijkstra over the 8-connected grid, where a step costs its own length plus
 * how far the cell sits above the window's lowest ground. Water is the lowest
 * continuous line through the frame, so the cheapest boundary-to-boundary path
 * is the river trench — and unlike a row-by-row scan it can follow the reach
 * that swings due west across the bottom of this window.
 *
 * Endpoints are found, not assumed: the source is the lowest cell on the
 * window's edge (where the river enters), the target the cheapest edge cell at
 * least half the frame away (where it leaves).
 */
function traceThalweg(grid) {
  const blur = smooth(grid, 2)
  let floor = Infinity
  for (const v of blur) if (v < floor) floor = v

  /** Metres of "uphill" cost per cell of travel — tunes trench-hugging. */
  const CELL = 1.0
  const weight = (i) => CELL + (blur[i] - floor)

  const isEdge = (x, y) =>
    x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1

  let source = 0
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      if (isEdge(x, y) && blur[i] < blur[source]) source = i
    }
  }

  const dist = new Float64Array(SIZE * SIZE).fill(Infinity)
  const back = new Int32Array(SIZE * SIZE).fill(-1)
  dist[source] = 0

  // 65k cells: a flat scan-for-minimum Dijkstra is O(n^2) but still trivial
  // here (~4 x 10^9 comparisons would not be — so use a simple binary heap).
  const heap = [[0, source]]
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length > 0 && last !== undefined) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === i) break
        ;[heap[i], heap[m]] = [heap[m], heap[i]]
        i = m
      }
    }
    return top
  }
  const push = (entry) => {
    heap.push(entry)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[i], heap[p]] = [heap[p], heap[i]]
      i = p
    }
  }

  const NEIGHBOURS = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, Math.SQRT2],
    [1, -1, Math.SQRT2],
    [-1, 1, Math.SQRT2],
    [-1, -1, Math.SQRT2],
  ]

  while (heap.length > 0) {
    const [d, i] = pop()
    if (d > dist[i]) continue
    const x = i % SIZE
    const y = (i - x) / SIZE
    for (const [dx, dy, len] of NEIGHBOURS) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue
      const ni = ny * SIZE + nx
      const nd = d + len * weight(ni)
      if (nd < dist[ni]) {
        dist[ni] = nd
        back[ni] = i
        push([nd, ni])
      }
    }
  }

  const sx = source % SIZE
  const sy = (source - sx) / SIZE
  let target = -1
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!isEdge(x, y)) continue
      if (Math.hypot(x - sx, y - sy) < SIZE / 2) continue
      const i = y * SIZE + x
      if (target < 0 || dist[i] < dist[target]) target = i
    }
  }
  if (target < 0) throw new Error('no through-flowing valley found in window')

  const path = []
  for (let i = target; i >= 0; i = back[i]) path.push(i)
  path.reverse()
  return path
}

const round = (v, dp) => Number(v.toFixed(dp))

/** Thin a traced cell path down to `count` lon/lat waypoints. */
function pathWaypoints(path, bounds, count = 22) {
  const picks = []
  for (let k = 0; k < count; k++) {
    picks.push(Math.round((k * (path.length - 1)) / (count - 1)))
  }
  return picks.map((p) => {
    const i = path[p]
    const x = i % SIZE
    const y = (i - x) / SIZE
    const lat = bounds.north - ((bounds.north - bounds.south) * y) / (SIZE - 1)
    const lon = bounds.west + ((bounds.east - bounds.west) * x) / (SIZE - 1)
    return [round(lon, 5), round(lat, 5)]
  })
}

/* --- emit ---------------------------------------------------------------- */

function quantise(grid) {
  let min = Infinity
  let max = -Infinity
  for (const v of grid) {
    if (v < min) min = v
    if (v > max) max = v
  }
  const bytes = Buffer.alloc(SIZE * SIZE)
  const span = max - min
  for (let i = 0; i < grid.length; i++) {
    bytes[i] = Math.round(((grid[i] - min) / span) * 255)
  }
  return { bytes, min, max }
}

function emitModule({ bounds, min, max, bytes, thalweg }) {
  const sha = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  const wp = thalweg.map(([lon, lat]) => `  [${lon}, ${lat}],`).join('\n')

  return `/* ---------------------------------------------------------------------------
 * GENERATED FILE — do not edit. Run \`pnpm bake:terrain\` to regenerate.
 *
 * Source: USGS 3DEP / NASA SRTM elevation (PUBLIC DOMAIN, no attribution
 * required) read from the AWS Open Data "Terrain Tiles" skadi endpoint. Full
 * provenance and licence reasoning live in scripts/bake-terrain.mjs.
 *
 * Window: ${SPAN_KM} km square centred on ${CENTER_LAT}, ${CENTER_LON}
 * (Purdue University campus, West Lafayette, Indiana).
 * ------------------------------------------------------------------------- */
import type { TerrainMeta } from './terrain'

export const TERRAIN_META: TerrainMeta = {
  assetUrl: '${ASSET_URL}',
  size: ${SIZE},
  bytes: ${bytes.length},
  sha256: '${sha}',
  bounds: {
    north: ${round(bounds.north, 6)},
    south: ${round(bounds.south, 6)},
    west: ${round(bounds.west, 6)},
    east: ${round(bounds.east, 6)},
  },
  minElevation: ${round(min, 1)},
  maxElevation: ${round(max, 1)},
  place: 'WEST LAFAYETTE / PURDUE',
  spanKm: ${SPAN_KM},
}

/**
 * The Wabash River's valley floor, traced as the least-cost path through the
 * baked heightfield itself (see \`traceThalweg\` in the bake script) — derived
 * from the public-domain elevation, not lifted from a licensed vector dataset.
 * Longitude, latitude pairs, north to south.
 */
export const WABASH_THALWEG: ReadonlyArray<readonly [number, number]> = [
${wp}
]
`
}

/* --- main ---------------------------------------------------------------- */

async function main() {
  const refresh = process.argv.includes('--refresh')
  const bounds = windowBounds()

  process.stdout.write(
    `baking ${SPAN_KM} km window around ${CENTER_LAT}, ${CENTER_LON}\n` +
      `  N ${bounds.north.toFixed(5)}  S ${bounds.south.toFixed(5)}` +
      `  W ${bounds.west.toFixed(5)}  E ${bounds.east.toFixed(5)}\n`,
  )

  const elevationAt = await loadMosaic(bounds, refresh)
  const grid = sampleGrid(elevationAt, bounds)
  const { bytes, min, max } = quantise(grid)
  const thalweg = pathWaypoints(traceThalweg(grid), bounds)

  await mkdir(dirname(BIN_OUT), { recursive: true })
  await writeFile(BIN_OUT, bytes)
  await writeFile(TS_OUT, emitModule({ bounds, min, max, bytes, thalweg }))

  process.stdout.write(
    `\n  relief ${min.toFixed(0)}-${max.toFixed(0)} m (${(max - min).toFixed(0)} m)\n` +
      `  ${BIN_OUT.replace(ROOT + '/', '')}  ${bytes.length} bytes\n` +
      `  ${TS_OUT.replace(ROOT + '/', '')}  ${thalweg.length} thalweg waypoints\n`,
  )
}

main().catch((err) => {
  process.stderr.write(`\nbake-terrain failed: ${err.message}\n`)
  process.exitCode = 1
})
