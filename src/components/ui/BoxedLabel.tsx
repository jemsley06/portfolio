/* ---------------------------------------------------------------------------
 * BoxedLabel — the `TEST PLUG 01` / `MONITOR` / `CHECK O.K.` chips along the
 * bottom of `eva-text-color-ex.png`: a thin tone-coloured rule around tracked
 * mono capitals on the black ground.
 *
 * Polymorphic over the three elements the design actually needs. As `a` or
 * `button` it inverts on hover/focus (mint-panel logic: a resolved state is a
 * filled slab) and keeps the global 2px orange focus ring — nothing here sets
 * `outline: none`, and the chip never clips its own ring.
 *
 * Prop note for later tasks: `tone` / `as` / `children` are the PLAN's
 * signature; the remaining props are the additive, explicitly-typed subset of
 * anchor and button attributes the chrome and pages need (href, download,
 * aria-current, onClick…). Nothing is spread blindly.
 * ------------------------------------------------------------------------- */
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BoxedLabelTone = 'nerv' | 'acid' | 'alert' | 'magi'

export type BoxedLabelProps = {
  children: ReactNode
  tone?: BoxedLabelTone
  as?: 'span' | 'a' | 'button'
  className?: string
  /* --- anchor --- */
  href?: string
  target?: string
  rel?: string
  download?: boolean | string
  /* --- button --- */
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLElement>
  /* --- shared --- */
  title?: string
  'aria-label'?: string
  'aria-current'?: AriaAttributes['aria-current']
  'aria-pressed'?: AriaAttributes['aria-pressed']
}

const BASE =
  'inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 font-mono text-xs leading-none tracking-telemetry uppercase'

const TONE: Record<BoxedLabelTone, string> = {
  nerv: 'border-nerv text-nerv text-glow-nerv',
  acid: 'border-acid text-acid text-glow-acid',
  alert: 'border-alert text-alert text-glow-alert',
  magi: 'border-magi text-magi text-glow-magi',
}

/* Interactive chips resolve to a filled slab, like a MAGI panel flipping from
   pending to approved. Written out per tone so Tailwind sees whole classes. */
const TONE_INTERACTIVE: Record<BoxedLabelTone, string> = {
  nerv: 'cursor-pointer transition-colors hover:bg-nerv hover:text-ink focus-visible:bg-nerv focus-visible:text-ink',
  acid: 'cursor-pointer transition-colors hover:bg-acid hover:text-ink focus-visible:bg-acid focus-visible:text-ink',
  alert:
    'cursor-pointer transition-colors hover:bg-alert hover:text-ink focus-visible:bg-alert focus-visible:text-ink',
  magi: 'cursor-pointer transition-colors hover:bg-magi hover:text-ink focus-visible:bg-magi focus-visible:text-ink',
}

export function BoxedLabel({
  children,
  tone = 'nerv',
  as = 'span',
  className,
  href,
  target,
  rel,
  download,
  type = 'button',
  disabled,
  onClick,
  title,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
  'aria-pressed': ariaPressed,
}: BoxedLabelProps) {
  const interactive = as === 'a' || as === 'button'
  const classes = cn(
    BASE,
    TONE[tone],
    interactive && TONE_INTERACTIVE[tone],
    className,
  )
  const shared = {
    className: classes,
    title,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
    'data-testid': 'boxed-label',
    'data-tone': tone,
  }

  if (as === 'a') {
    return (
      <a
        {...shared}
        href={href}
        target={target}
        /* Opening a new tab without this hands the opener to the target. */
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        download={download}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  if (as === 'button') {
    return (
      <button
        {...shared}
        type={type}
        disabled={disabled}
        aria-pressed={ariaPressed}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  return <span {...shared}>{children}</span>
}
