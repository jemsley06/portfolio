/* ---------------------------------------------------------------------------
 * NavTab — one `ROUTES` entry rendered as a boxed MAGI-style nav chip.
 *
 * `react-router`'s `NavLink` already stamps `aria-current="page"` on the
 * underlying `<a>` when the route matches (its documented default — see
 * `NavLinkProps['aria-current']`), so this component only reacts to the
 * `isActive` render prop for styling:
 *   inactive = orange outline  — `BoxedLabel tone="nerv"`, a pending MAGI read
 *   active   = filled mint bg + ink text — a *resolved* MAGI panel, the same
 *              pairing `MagiPanel`'s own `filled` variant uses
 *              (`bg-magi text-ink`), reused here as literal utility classes
 *              since `BoxedLabel` has no "filled" tone of its own.
 *
 * The `!` (important) modifier on the active override is required: the
 * `magi` tone already sets `text-magi`, and a plain `text-ink` class carries
 * the same specificity, so which one wins depends on Tailwind's generated
 * rule order rather than JSX class order. `!` makes the override
 * unconditional.
 *
 * English-only treatment (R1). The kanji sub-label that used to fill out the
 * chip is gone; in its place is a small decorative "CH.0N" channel eyebrow —
 * a plain zero-padded position number (1-based `index` prop, supplied by the
 * caller from its `ROUTES.map` index) styled the way `eva-text-color-ex.png`
 * sets its `TEST PLUG 01` / `MONITOR` boxed captions: tracked-out mono capitals
 * above the main label. It is decorative only (`aria-hidden`) — the link's
 * accessible name stays exactly the route label ("HOME", "PILOT", …), and the
 * `NavLink`'s own text content is what a screen reader announces.
 *
 * R5 defect #4 (mobile tab heights): every chip carries `min-h-11` (44px, a
 * standard touch target) and the label line is `whitespace-nowrap`, so the
 * four tabs always render at one equal height on a single row — this is what
 * used to drift when the old kanji sub-label varied in glyph count per route.
 * ------------------------------------------------------------------------- */
import { NavLink } from 'react-router'
import type { Route } from '../../routes'
import { cn } from '../../lib/cn'
import { BoxedLabel } from '../ui/BoxedLabel'

export type NavTabProps = {
  route: Route
  /** 1-based position in `ROUTES`, used only for the decorative "CH.0N" eyebrow. */
  index?: number
  className?: string
}

export function NavTab({ route, index, className }: NavTabProps) {
  return (
    <NavLink to={route.path} end={route.path === '/'} className={className}>
      {({ isActive }) => (
        <BoxedLabel
          as="span"
          tone={isActive ? 'magi' : 'nerv'}
          className={cn(
            'min-h-11 flex-col justify-center gap-0.5 text-center',
            isActive && 'bg-magi! text-ink!',
          )}
        >
          {index !== undefined && (
            <span
              aria-hidden="true"
              className="text-[0.6rem] tracking-telemetry opacity-70"
            >
              CH.{String(index).padStart(2, '0')}
            </span>
          )}
          <span className="whitespace-nowrap">{route.label}</span>
        </BoxedLabel>
      )}
    </NavLink>
  )
}
