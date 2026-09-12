/* ---------------------------------------------------------------------------
 * HatchBar — the hatched slab that leads the teal NERV wordmark at the bottom
 * of `_.gif`. Measured there: stripes lean right at ~60° from horizontal with
 * a roughly 1:1 line-to-gap ratio, which is a 120deg repeating gradient.
 *
 * Purely decorative, so the bar is `aria-hidden` — whatever it separates
 * carries the meaning. Height comes from the class list (`h-4` by default) so
 * a caller can stretch it with `className` without a new prop; a taller bar
 * keeps the reference's line:gap ratio by overriding `--hatch-line` and
 * `--hatch-pitch` (defaults 5px / 9px — the 0.31 : 0.55 line-to-height ratio
 * measured in `_.gif`, applied to the 16px bar).
 * ------------------------------------------------------------------------- */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

export type HatchBarTone = 'magi' | 'nerv'

export type HatchBarProps = {
  tone?: HatchBarTone
  className?: string
}

const TONE_VAR: Record<HatchBarTone, string> = {
  magi: 'var(--color-magi)',
  nerv: 'var(--color-nerv)',
}

export function HatchBar({ tone = 'magi', className }: HatchBarProps) {
  const style: CSSProperties = {
    backgroundImage: `repeating-linear-gradient(120deg, ${TONE_VAR[tone]} 0 var(--hatch-line, 5px), transparent var(--hatch-line, 5px) var(--hatch-pitch, 9px))`,
  }

  return (
    <div
      className={cn('h-4 w-full', className)}
      style={style}
      data-testid="hatch-bar"
      data-tone={tone}
      aria-hidden="true"
    />
  )
}
