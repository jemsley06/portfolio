import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read as text rather than importing it: the Tailwind Vite plugin owns
// `tokens.css`, so `?raw` comes back empty.
const tokensCss = readFileSync(
  join(process.cwd(), 'src/styles/tokens.css'),
  'utf8',
)

/** Every colour token in PLAN.md § Global Constraints. */
const COLOR_TOKENS = [
  'ink',
  'ink-2',
  'nerv',
  'nerv-hot',
  'amber',
  'magi',
  'acid',
  'alert',
  'alert-deep',
  'plug-blue',
  'plug-magenta',
  'bone',
  'steel',
] as const

const FONT_TOKENS = ['display', 'mono'] as const

function declaration(name: string): RegExpMatchArray | null {
  return tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`))
}

describe('tokens.css', () => {
  it('imports Tailwind exactly once (tokens.css owns the import)', () => {
    expect(tokensCss.match(/@import\s+['"]tailwindcss['"]/g)).toHaveLength(1)
  })

  it('declares the theme in a static @theme block so vars are always emitted', () => {
    expect(tokensCss).toMatch(/@theme\s+static\s*\{/)
  })

  it.each(COLOR_TOKENS)('declares --color-%s as a hex value', (token) => {
    const match = declaration(`color-${token}`)
    expect(match, `--color-${token} is missing from tokens.css`).not.toBeNull()
    expect(match?.[1].trim()).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('declares no colour tokens beyond the Global Constraints table', () => {
    const declared = [...tokensCss.matchAll(/--color-([a-z0-9-]+):/g)].map(
      (m) => m[1],
    )
    expect(declared.sort()).toEqual([...COLOR_TOKENS].sort())
  })

  it.each(FONT_TOKENS)('declares --font-%s with a system fallback', (token) => {
    const match = declaration(`font-${token}`)
    expect(match, `--font-${token} is missing from tokens.css`).not.toBeNull()
    const stack = (match?.[1] ?? '').split(',')
    expect(stack.length).toBeGreaterThan(1)
    expect(stack.at(-1)?.trim()).toMatch(/^(sans-serif|monospace)$/)
  })

  it('declares --tracking-telemetry', () => {
    expect(declaration('tracking-telemetry')?.[1].trim()).toMatch(/^[\d.]+em$/)
  })
})
