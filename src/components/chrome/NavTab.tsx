/* ---------------------------------------------------------------------------
 * NavTab — one `ROUTES` entry rendered as a boxed MAGI-style nav chip:
 * `BoxedLabel` for the box, `Kanji` inside it as the jp-glyph / EN-gloss
 * pair PLAN Task 5 calls its "sub-label".
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
 * `Kanji` only knows `nerv | acid | alert` tones (no `ink` or `magi`), so the
 * kanji sub-label keeps its `nerv` colouring even on the filled/active chip —
 * a deliberate simplification rather than forking or extending Task 4's
 * primitive for this one caller (see the Task 5 report for the tradeoff).
 * ------------------------------------------------------------------------- */
import { NavLink } from 'react-router'
import type { Route } from '../../routes'
import { BoxedLabel } from '../ui/BoxedLabel'
import { Kanji } from '../ui/Kanji'

export type NavTabProps = {
  route: Route
  className?: string
}

export function NavTab({ route, className }: NavTabProps) {
  return (
    <NavLink to={route.path} end={route.path === '/'} className={className}>
      {({ isActive }) => (
        <BoxedLabel
          as="span"
          tone={isActive ? 'magi' : 'nerv'}
          className={isActive ? 'bg-magi! text-ink!' : undefined}
        >
          <Kanji jp={route.kanji} en={route.label} tone="nerv" />
        </BoxedLabel>
      )}
    </NavLink>
  )
}
