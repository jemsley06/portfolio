/* ---------------------------------------------------------------------------
 * HazardStripe — the red-on-black diagonal warning band that runs beside the
 * countdown in `eva-timer.gif` and behind the hazard badge in `_.gif`.
 *
 * Measured off the references: bands of equal width and gap, leaning right
 * ("///") at 45°. In CSS a `repeating-linear-gradient` at 135deg puts the
 * gradient axis down-right, so the bands themselves run up-right — the lean in
 * the stills. Stripe pitch scales with `height` so a 10px rule and a 48px
 * divider keep the same texture.
 *
 * The stripes are decoration: the band is `aria-hidden` unless a `label` is
 * given (R1 — English only, e.g. `DANGER`, not the show's kanji), in which
 * case the label is real, readable text and only the stripes stay hidden.
 *
 * R5 defect #2: `alert`-on-`alert` red text over the red half of the stripes
 * read at almost no contrast. The stripe layer is pinned to a negative
 * z-index (`-z-10`), which — per the CSS2 painting order — always paints
 * *behind* an ordinary, non-positioned sibling regardless of DOM order. That
 * guarantees the label's own `bg-ink` plate is never occluded by the stripe
 * pattern, independent of how the two are ordered in markup.
 * ------------------------------------------------------------------------- */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

export type HazardStripeProps = {
  /** Band height in px (default 16 — the divider weight used on Home). */
  height?: number
  /** Optional centred text, e.g. "DANGER". */
  label?: string
  className?: string
}

type StripeStyle = CSSProperties & Record<`--${string}`, string>

export function HazardStripe({
  height = 16,
  label,
  className,
}: HazardStripeProps) {
  const pitch = Math.max(6, Math.round(height * 0.75))
  const style: StripeStyle = {
    height: `${height}px`,
    '--hazard-pitch': `${pitch}px`,
  }

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={style}
      data-testid="hazard-stripe"
      data-height={height}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-alert) 0 var(--hazard-pitch), var(--color-ink) var(--hazard-pitch) calc(var(--hazard-pitch) * 2))',
        }}
        data-testid="hazard-stripe-bands"
        aria-hidden="true"
      />
      {label && (
        <p
          className="bg-ink text-alert text-glow-alert px-3 py-0.5 text-sm leading-none uppercase"
          data-testid="hazard-stripe-label"
          data-plate="ink"
        >
          {label}
        </p>
      )}
    </div>
  )
}
