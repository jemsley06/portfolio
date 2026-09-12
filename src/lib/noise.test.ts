import { describe, expect, it } from 'vitest'
import {
  createProceduralHeight,
  fbm2D,
  hashToUnit,
  peakAt,
  valueNoise2D,
} from './noise'

/** A deterministic sweep of coordinates, including negatives and non-integers. */
function coordinates(): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let i = -4; i <= 4; i += 0.37) {
    for (let j = -4; j <= 4; j += 0.53) out.push([i, j])
  }
  return out
}

describe('hashToUnit', () => {
  it('returns values in [0, 1)', () => {
    for (let x = -50; x < 50; x++) {
      for (let y = -50; y < 50; y += 7) {
        const v = hashToUnit(1, x, y)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })

  it('is deterministic for a seed and decorrelates adjacent cells', () => {
    expect(hashToUnit(3, 10, 20)).toBe(hashToUnit(3, 10, 20))
    expect(hashToUnit(3, 10, 20)).not.toBe(hashToUnit(3, 11, 20))
    expect(hashToUnit(3, 10, 20)).not.toBe(hashToUnit(4, 10, 20))
  })

  it('is not symmetric in x and y (no diagonal banding)', () => {
    expect(hashToUnit(1, 5, 9)).not.toBe(hashToUnit(1, 9, 5))
  })
})

describe('valueNoise2D', () => {
  it('stays inside [0, 1]', () => {
    for (const [x, y] of coordinates()) {
      const v = valueNoise2D(11, x, y)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic for a seed', () => {
    const a = coordinates().map(([x, y]) => valueNoise2D(11, x, y))
    const b = coordinates().map(([x, y]) => valueNoise2D(11, x, y))
    expect(a).toEqual(b)
  })

  it('gives a different field for a different seed', () => {
    const a = coordinates().map(([x, y]) => valueNoise2D(11, x, y))
    const b = coordinates().map(([x, y]) => valueNoise2D(12, x, y))
    expect(a).not.toEqual(b)
  })

  it('interpolates the lattice — it is continuous, not stepped', () => {
    const step = 1e-4
    let worst = 0
    for (let x = 0; x < 3; x += 0.05) {
      worst = Math.max(
        worst,
        Math.abs(valueNoise2D(5, x, 1.5) - valueNoise2D(5, x + step, 1.5)),
      )
    }
    expect(worst).toBeLessThan(0.01)
  })

  it('reproduces the lattice value exactly at integer coordinates', () => {
    expect(valueNoise2D(9, 4, 6)).toBeCloseTo(hashToUnit(9, 4, 6), 12)
  })
})

describe('fbm2D', () => {
  it('stays inside [0, 1] whatever the octave count', () => {
    for (const octaves of [1, 3, 6]) {
      for (const [x, y] of coordinates()) {
        const v = fbm2D(2, x, y, { octaves })
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is deterministic for a seed', () => {
    expect(fbm2D(2, 1.25, -3.5)).toBe(fbm2D(2, 1.25, -3.5))
  })

  it('adds detail rather than amplitude as octaves grow', () => {
    const one = fbm2D(2, 0.5, 0.5, { octaves: 1 })
    const six = fbm2D(2, 0.5, 0.5, { octaves: 6 })
    expect(one).not.toBe(six)
    expect(six).toBeLessThanOrEqual(1)
  })
})

describe('peakAt', () => {
  it('peaks at its centre and decays away from it', () => {
    const peak = { x: 0.5, y: 0.5, h: 0.8, sigma: 0.05 }
    expect(peakAt(peak, 0.5, 0.5)).toBeCloseTo(0.8, 10)
    expect(peakAt(peak, 0.6, 0.5)).toBeLessThan(0.2)
    expect(peakAt(peak, 0.9, 0.9)).toBeCloseTo(0, 6)
  })
})

describe('createProceduralHeight', () => {
  it('is deterministic for a seed and in [0, 1] everywhere', () => {
    const field = createProceduralHeight({ seed: 42 })
    const again = createProceduralHeight({ seed: 42 })
    for (let y = 0; y <= 1; y += 0.05) {
      for (let x = 0; x <= 1; x += 0.05) {
        const v = field(x, y)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
        expect(v).toBe(again(x, y))
      }
    }
  })

  it('clamps a stack of tall peaks instead of overflowing 1', () => {
    const field = createProceduralHeight({
      seed: 1,
      peaks: [
        { x: 0.5, y: 0.5, h: 0.9 },
        { x: 0.5, y: 0.5, h: 0.9 },
      ],
    })
    expect(field(0.5, 0.5)).toBe(1)
  })

  it('raises the ground under a peak', () => {
    const flat = createProceduralHeight({ seed: 3 })
    const bumped = createProceduralHeight({
      seed: 3,
      peaks: [{ x: 0.5, y: 0.45, h: 0.4, sigma: 0.05 }],
    })
    expect(bumped(0.5, 0.45)).toBeGreaterThan(flat(0.5, 0.45))
    expect(bumped(0.05, 0.95)).toBeCloseTo(flat(0.05, 0.95), 6)
  })
})
