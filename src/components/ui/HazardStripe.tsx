/* ---------------------------------------------------------------------------
 * HazardStripe — the red-on-black diagonal warning band that runs beside the
 * countdown in `eva-timer.gif` and behind the 危険 badge in `_.gif`.
 *
 * Measured off the references: bands of equal width and gap, leaning right
 * ("///") at 45°. In CSS a `repeating-linear-gradient` at 135deg puts the
 * gradient axis down-right, so the bands themselves run up-right — the lean in
 * the stills. Stripe pitch scales with `height` so a 10px rule and a 48px
 * divider keep the same texture.
 *
 * The stripes are decoration: the band is `aria-hidden` unless a `label` is
 * given, in which case the label is real text on an ink plate (exactly how the
 * references cut the stripes to seat 危険) and only the stripes stay hidden.
 * ------------------------------------------------------------------------- */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

export type HazardStripeProps = {
  /** Band height in px (default 16 — the divider weight used on Home). */
  height?: number
  /** Optional centred text, usually the kanji 危険. */
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
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-alert) 0 var(--hazard-pitch), var(--color-ink) var(--hazard-pitch) calc(var(--hazard-pitch) * 2))',
        }}
        data-testid="hazard-stripe-bands"
        aria-hidden="true"
      />
      {label && (
        <p
          className="kanji bg-ink text-alert text-glow-alert relative px-3 text-sm leading-none"
          lang="ja"
        >
          {label}
        </p>
      )}
    </div>
  )
}
