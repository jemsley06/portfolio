/* ---------------------------------------------------------------------------
 * GENERATED FILE — do not edit. Run `pnpm bake:terrain` to regenerate.
 *
 * Source: USGS 3DEP / NASA SRTM elevation (PUBLIC DOMAIN, no attribution
 * required) read from the AWS Open Data "Terrain Tiles" skadi endpoint. Full
 * provenance and licence reasoning live in scripts/bake-terrain.mjs.
 *
 * Window: 15 km square centred on 40.4237, -86.9212
 * (Purdue University campus, West Lafayette, Indiana).
 * ------------------------------------------------------------------------- */
import type { TerrainMeta } from './terrain'

export const TERRAIN_META: TerrainMeta = {
  assetUrl: '/terrain/west-lafayette-256.u8',
  size: 256,
  bytes: 65536,
  sha256: '7b619f60212a69c8',
  bounds: {
    north: 40.491187,
    south: 40.356213,
    west: -87.009701,
    east: -86.832699,
  },
  minElevation: 153,
  maxElevation: 223,
  place: 'WEST LAFAYETTE / PURDUE',
  spanKm: 15,
}

/**
 * The Wabash River's valley floor, traced as the least-cost path through the
 * baked heightfield itself (see `traceThalweg` in the bake script) — derived
 * from the public-domain elevation, not lifted from a licensed vector dataset.
 * Longitude, latitude pairs, north to south.
 */
export const WABASH_THALWEG: ReadonlyArray<readonly [number, number]> = [
  [-87.0097, 40.40861],
  [-86.99929, 40.4065],
  [-86.98957, 40.40438],
  [-86.97916, 40.40332],
  [-86.96944, 40.40332],
  [-86.95903, 40.40279],
  [-86.94862, 40.39803],
  [-86.9389, 40.39803],
  [-86.92849, 40.39803],
  [-86.91808, 40.40015],
  [-86.90836, 40.40597],
  [-86.90142, 40.41391],
  [-86.89656, 40.42132],
  [-86.89656, 40.42926],
  [-86.89517, 40.4372],
  [-86.89448, 40.44461],
  [-86.8917, 40.45255],
  [-86.88962, 40.46049],
  [-86.88406, 40.4679],
  [-86.87435, 40.47584],
  [-86.87157, 40.48325],
  [-86.86532, 40.49119],
]
