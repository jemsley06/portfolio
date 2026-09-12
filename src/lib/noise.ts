/* ---------------------------------------------------------------------------
 * noise.ts — deterministic 2-D value noise for `TopoMap`'s procedural
 * heightfield (PLAN Task 8).
 *
 * Real West Lafayette elevation is the default ground for the map (PLAN R4);
 * this module is the fallback that keeps the component drawing when the baked
 * asset is missing, and the source of invented terrain for pages that want a
 * field that is not a real place.
 *
 * Everything here is a pure function of its arguments — same seed, same
 * coordinates, same number, in any engine, forever. No `Math.random()`, no
 * module-level mutable state, no lookup table to keep in sync. Every exported
 * function returns a value in the closed interval [0, 1].
 * ------------------------------------------------------------------------- */

/**
 * Integer hash → [0, 1). A 32-bit avalanche (the murmur3 finaliser) over the
 * mixed coordinates: adjacent cells decorrelate completely, which is the whole
 * job of the lattice hash in value noise.
 */
export function hashToUnit(seed: number, ix: number, iy: number): number {
  let h =
    (Math.imul(ix | 0, 0x27d4eb2d) ^
      Math.imul(iy | 0, 0x165667b1) ^
      Math.imul(seed | 0, 0x9e3779b1)) |
    0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h = (h ^ (h >>> 16)) >>> 0
  return h / 0x1_0000_0000
}

/** Quintic smoothstep — C2 continuous, so no visible lattice creases. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Bilinear value noise on the integer lattice. Continuous, in [0, 1], with
 * feature size 1 unit — scale the coordinates to change the frequency.
 */
export function valueNoise2D(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = fade(x - x0)
  const fy = fade(y - y0)

  const n00 = hashToUnit(seed, x0, y0)
  const n10 = hashToUnit(seed, x0 + 1, y0)
  const n01 = hashToUnit(seed, x0, y0 + 1)
  const n11 = hashToUnit(seed, x0 + 1, y0 + 1)

  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy)
}

export type FbmOptions = {
  /** Number of summed octaves. PLAN Task 8 asks for 3. */
  octaves?: number
  /** Frequency multiplier between octaves. */
  lacunarity?: number
  /** Amplitude multiplier between octaves. */
  gain?: number
}

/**
 * Fractal sum of `octaves` value-noise layers, renormalised back into [0, 1]
 * by the total amplitude so the range never depends on the octave count.
 */
export function fbm2D(
  seed: number,
  x: number,
  y: number,
  { octaves = 3, lacunarity = 2, gain = 0.5 }: FbmOptions = {},
): number {
  let sum = 0
  let amplitude = 1
  let total = 0
  let frequency = 1

  for (let i = 0; i < octaves; i++) {
    // Offsetting the seed per octave stops the layers from sharing lattice
    // lines, which otherwise shows up as a faint grid in the heightfield.
    sum +=
      valueNoise2D(seed + i * 0x9e37, x * frequency, y * frequency) * amplitude
    total += amplitude
    amplitude *= gain
    frequency *= lacunarity
  }

  return total === 0 ? 0 : sum / total
}

/** A single Gaussian bump — the sharp summit in `references/eva-map-ex.png`. */
export type Peak = {
  /** Centre, in the same 0-1 field coordinates the heightfield uses. */
  x: number
  y: number
  /** Peak height added at the centre, 0-1. */
  h: number
  /** Standard deviation in field units. Small = the spike, large = a swell. */
  sigma?: number
}

export function peakAt(peak: Peak, x: number, y: number): number {
  const sigma = peak.sigma ?? 0.06
  const dx = (x - peak.x) / sigma
  const dy = (y - peak.y) / sigma
  return peak.h * Math.exp(-0.5 * (dx * dx + dy * dy))
}

export type ProceduralFieldOptions = FbmOptions & {
  seed?: number
  /** Noise cells across the 0-1 field. Higher = busier ground. */
  frequency?: number
  /** Gaussian summits added on top of the noise. */
  peaks?: readonly Peak[]
  /** Weight of the noise under the peaks, 0-1. */
  base?: number
}

/**
 * Builds the sampler `TopoMap` uses when it draws invented ground: multi-octave
 * value noise with Gaussian peaks blended over the top. Deterministic for a
 * given `seed`, always in [0, 1].
 *
 * Peaks BLEND rather than add (`noise * (1 - p) + p`). Adding and then clamping
 * is the obvious implementation and it is wrong: a tall summit saturates at 1
 * and the profile lines draw a flat mesa with horizontal runs across its top,
 * which looks like a bug. Blending keeps the summit sharp and cannot overflow.
 */
export function createProceduralHeight({
  seed = 1,
  frequency = 3.2,
  peaks = [],
  base = 0.72,
  ...fbm
}: ProceduralFieldOptions = {}): (x: number, y: number) => number {
  return (x: number, y: number): number => {
    const ground = fbm2D(seed, x * frequency, y * frequency, fbm) * base
    let summit = 0
    for (const peak of peaks) summit += peakAt(peak, x, y)
    if (summit <= 0) return ground
    if (summit >= 1) return 1
    return ground * (1 - summit) + summit
  }
}
