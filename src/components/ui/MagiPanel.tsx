/* ---------------------------------------------------------------------------
 * MagiPanel — the MAGI deliberation panel (`eva-magi-1.png`, `eva-magi-2.png`,
 * `Evangelion UI - Magi report.jpeg`).
 *
 * Geometry. A clipped element cannot keep a border, so the panel is two nested
 * divs carrying the SAME polygon (PLAN Task 4 step 2): the outer div is a
 * solid slab of border colour, the inner one is inset by `--magi-panel-border`
 * (5px, ≈2% of a 250px panel — the thickness measured off `eva-magi-1.png`)
 * and re-clipped, so the orange rim survives the cut on every edge including
 * the diagonals.
 *
 * States, straight off the references:
 *   outline  pending    — orange rim, `ink-2` interior, orange text (magi-2)
 *   filled   resolved   — orange rim, mint interior, `ink` text (magi-1)
 *   denied   rejected   — `alert` rim, washed red interior, red text + stamp
 *
 * The title is a <p>, not a heading: panels are dropped into MagiTriad, the
 * projects grid and the 404 page, and a hard-coded level would break those
 * documents' outlines. Pages that need a heading pass one in `children`.
 * ------------------------------------------------------------------------- */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type MagiPanelVariant = 'outline' | 'filled' | 'denied'
export type MagiPanelShape = 'square' | 'pentagon' | 'trapezoid'
/** 承認 approved · 否定 denied · 審議中 deliberating. */
export type MagiPanelStamp = '承認' | '否定' | '審議中'

export type MagiPanelProps = {
  variant: MagiPanelVariant
  title: string
  /** MAGI unit number, rendered as the `·1` suffix seen in the show's UI. */
  index?: 1 | 2 | 3
  stamp?: MagiPanelStamp
  shape?: MagiPanelShape
  /** Degrees of tilt — `eva-magi-2.png` scatters its panels between ±20°. */
  rotate?: number
  children?: ReactNode
  className?: string
}

/* Shapes traced from the references. `pentagon` is the down-pointing house of
   the Magi report's BALTHASAR panel; `trapezoid` is the tapered slab the three
   `eva-magi-1.png` panels share. */
const SHAPE_CLIP: Record<MagiPanelShape, string> = {
  square: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  pentagon: 'polygon(0% 0%, 100% 0%, 100% 64%, 50% 100%, 0% 64%)',
  trapezoid: 'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)',
}

const OUTER_TONE: Record<MagiPanelVariant, string> = {
  outline: 'bg-nerv',
  filled: 'bg-nerv',
  denied: 'bg-alert',
}

const INNER_TONE: Record<MagiPanelVariant, string> = {
  outline: 'bg-ink-2 text-nerv',
  filled: 'bg-magi text-ink',
  /* `alert-deep` is a decorative fill only, so it is diluted into `ink` and the
     text above it stays the 4.5:1 `alert` red. */
  denied: 'bg-alert-deep/25 text-alert',
}

const STAMP_TONE: Record<MagiPanelStamp, string> = {
  承認: 'border-magi text-magi text-glow-magi',
  否定: 'border-alert text-alert text-glow-alert',
  審議中: 'border-alert text-alert text-glow-alert',
}

/** What each stamp says, for assistive tech (the kanji alone reads as noise in
 *  an English page context). */
const STAMP_MEANING: Record<MagiPanelStamp, string> = {
  承認: 'APPROVED',
  否定: 'DENIED',
  審議中: 'DELIBERATING',
}

export function MagiPanel({
  variant,
  title,
  index,
  stamp,
  shape = 'square',
  rotate,
  children,
  className,
}: MagiPanelProps) {
  const clipPath = SHAPE_CLIP[shape]
  const outerStyle: CSSProperties = {
    clipPath,
    padding: 'var(--magi-panel-border, 5px)',
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
  }
  /* A filled panel carries ink-on-mint text, so its stamp flips to ink too. */
  const stampTone = stamp
    ? variant === 'filled'
      ? 'border-ink text-ink'
      : STAMP_TONE[stamp]
    : undefined

  return (
    <div
      className={cn('relative', OUTER_TONE[variant], className)}
      style={outerStyle}
      data-testid="magi-panel"
      data-variant={variant}
      data-shape={shape}
      data-index={index}
    >
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center',
          INNER_TONE[variant],
        )}
        style={{ clipPath }}
      >
        <p className="font-display text-2xl leading-none tracking-wide uppercase">
          {title}
          {index !== undefined && <span aria-hidden="true">·{index}</span>}
          {index !== undefined && <span className="sr-only"> {index}</span>}
        </p>
        {stamp && (
          <p
            className={cn(
              'kanji border-2 px-3 py-1 text-xl leading-none',
              stampTone,
            )}
            data-stamp={stamp}
          >
            <span lang="ja">{stamp}</span>
            <span className="sr-only"> {STAMP_MEANING[stamp]}</span>
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
