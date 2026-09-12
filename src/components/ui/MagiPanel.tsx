/* ---------------------------------------------------------------------------
 * MagiPanel — the MAGI deliberation panel (`eva-magi-1.png`, `eva-magi-2.png`,
 * `Evangelion UI - Magi report.jpeg`).
 *
 * Geometry. A clipped element cannot keep a border, so the panel is two nested
 * divs carrying the SAME polygon (PLAN Task 4 step 2): the outer div is a
 * solid slab of border colour, the inner one is inset by `--magi-panel-border`
 * (5px, ≈2% of a 250px panel — the thickness measured off `eva-magi-1.png`)
 * and re-clipped, so the orange rim survives the cut on every edge including
 * the diagonals. R2 adds `chamfer`, a 45° corner cut sized by `--magi-chamfer`;
 * the interior's cut is shrunk by `b(2−√2)` so the rim stays the same width on
 * the diagonal as on the straight edges (see CHAMFER_INNER).
 *
 * States, straight off the references:
 *   outline  pending    — orange rim, `ink-2` interior, orange text (magi-2)
 *   filled   resolved   — orange rim, mint interior, `ink` text (magi-1)
 *   denied   rejected   — `alert` rim, the SAME dark `ink-2` interior as
 *                         `outline`, red text + stamp (R5 defect #1: this
 *                         used to wash the whole interior in red, which sank
 *                         the stamp into the fill; the fix keeps the panel's
 *                         normal dark interior and lets only the rim and
 *                         stamp carry `alert`)
 *
 * Themable lengths, all defaulting to what the panel already looked like:
 * `--magi-panel-border` (rim, 5px), `--magi-chamfer` (corner cut, 1.75rem),
 * `--magi-panel-pad` (interior padding SHORTHAND, 1rem) and
 * `--magi-panel-title` / `--magi-panel-title-scale` (title size and its
 * horizontal compression). A panel sized in container units
 * must be able to scale ALL of them; a hard-coded `p-4` inside a `cqw` layout
 * eats a different share of the slab at every width.
 *
 * The title is a <p>, not a heading: panels are dropped into MagiTriad, the
 * projects grid and the 404 page, and a hard-coded level would break those
 * documents' outlines. Pages that need a heading pass one in `children`.
 * ------------------------------------------------------------------------- */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type MagiPanelVariant = 'outline' | 'filled' | 'denied'
export type MagiPanelShape = 'square' | 'pentagon' | 'trapezoid'
/** Corners a `chamfer` may cut. R2 — the 45° cuts of `eva-magi-1.png`. */
export type MagiPanelCorner =
  'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'
/** R1 — English stamp glyphs (no kanji): approved · denied · deliberating. */
export type MagiPanelStamp = 'APPROVED' | 'DENIED' | 'PENDING'

export type MagiPanelProps = {
  variant: MagiPanelVariant
  title: string
  /** MAGI unit number, rendered as the `·1` suffix seen in the show's UI. */
  index?: 1 | 2 | 3
  stamp?: MagiPanelStamp
  shape?: MagiPanelShape
  /**
   * R2 — cut one or more corners at a true 45°, the slab shape the three
   * `eva-magi-1.png` panels use where they face the MAGI hub. Overrides
   * `shape`. The cut length is `--magi-chamfer` (a LENGTH, never a
   * percentage: equal px on both axes is what makes the cut 45° whatever the
   * panel's aspect ratio), so one slab works inside `MagiTriad` and alone as
   * a project card.
   */
  chamfer?: MagiPanelCorner | readonly MagiPanelCorner[]
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

/* The cut length, and the same cut shrunk to keep the rim an even thickness.
   A 45° edge inset by `b` on both axes moves `b·√2` along its own normal, so
   an interior inset by `b` and clipped with the SAME `k` would leave a rim of
   `b·√2` on the diagonal and `b` everywhere else. `k − b(2−√2)` cancels it. */
const CHAMFER = 'var(--magi-chamfer, 1.75rem)'
const CHAMFER_INNER =
  'max(0px, calc(var(--magi-chamfer, 1.75rem) - 0.5857864 * var(--magi-panel-border, 5px)))'

function chamferClip(corners: readonly MagiPanelCorner[], k: string): string {
  const rest = `calc(100% - ${k})`
  const points = [
    ...(corners.includes('top-left') ? [`0% ${k}`, `${k} 0%`] : ['0% 0%']),
    ...(corners.includes('top-right')
      ? [`${rest} 0%`, `100% ${k}`]
      : ['100% 0%']),
    ...(corners.includes('bottom-right')
      ? [`100% ${rest}`, `${rest} 100%`]
      : ['100% 100%']),
    ...(corners.includes('bottom-left')
      ? [`${k} 100%`, `0% ${rest}`]
      : ['0% 100%']),
  ]
  return `polygon(${points.join(', ')})`
}

const OUTER_TONE: Record<MagiPanelVariant, string> = {
  outline: 'bg-nerv',
  filled: 'bg-nerv',
  denied: 'bg-alert',
}

const INNER_TONE: Record<MagiPanelVariant, string> = {
  outline: 'bg-ink-2 text-nerv',
  filled: 'bg-magi text-ink',
  /* R5 defect #1 — same dark `ink-2` interior as `outline`, just red text, so
     a denied panel reads as "alert rim over a normal panel" rather than a
     solid red block. */
  denied: 'bg-ink-2 text-alert',
}

const STAMP_TONE: Record<MagiPanelStamp, string> = {
  APPROVED: 'border-magi text-magi text-glow-magi',
  DENIED: 'border-alert text-alert text-glow-alert',
  PENDING: 'border-alert text-alert text-glow-alert',
}

export function MagiPanel({
  variant,
  title,
  index,
  stamp,
  shape = 'square',
  chamfer,
  rotate,
  children,
  className,
}: MagiPanelProps) {
  const corners: readonly MagiPanelCorner[] =
    chamfer === undefined
      ? []
      : typeof chamfer === 'string'
        ? [chamfer]
        : chamfer
  const clipPath = corners.length
    ? chamferClip(corners, CHAMFER)
    : SHAPE_CLIP[shape]
  const interiorClipPath = corners.length
    ? chamferClip(corners, CHAMFER_INNER)
    : clipPath
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
      data-chamfer={corners.length ? corners.join(' ') : undefined}
      data-index={index}
    >
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3 text-center',
          INNER_TONE[variant],
        )}
        style={{
          clipPath: interiorClipPath,
          /* A `padding` SHORTHAND, so a caller can keep content clear of a
             chamfered corner asymmetrically. Default `1rem` == the `p-4` this
             replaces, so every existing panel is unchanged. */
          padding: 'var(--magi-panel-pad, 1rem)',
        }}
        data-testid="magi-panel-interior"
      >
        <p
          className="font-display leading-none tracking-wide uppercase"
          style={{
            fontSize: 'var(--magi-panel-title, 1.5rem)',
            /* Horizontal compression, so a title sized for a condensed face
               still fits when a wide fallback font resolves instead. Scaling
               the block about its centre keeps centred text centred. */
            transform: 'scaleX(var(--magi-panel-title-scale, 1))',
            transformOrigin: 'center',
          }}
        >
          {title}
          {index !== undefined && <span aria-hidden="true">·{index}</span>}
          {index !== undefined && <span className="sr-only"> {index}</span>}
        </p>
        {stamp && (
          <p
            className={cn(
              'border-2 px-3 py-1 text-xl leading-none uppercase tracking-wide',
              stampTone,
            )}
            data-testid="magi-panel-stamp"
            data-stamp={stamp}
          >
            {stamp}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
