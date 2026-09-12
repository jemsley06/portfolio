/* ---------------------------------------------------------------------------
 * HudFooter — the terminal's sign-off: a `HazardStripe` rule, the
 * CODE/FILE/EXTENTION metadata slug from `eva-magi-1.png` / `eva-magi-2.png`,
 * the site's only contact surface (Global Constraints: static deployment, no
 * server — contact is links only), and a `NERV`-style hatched wordmark like
 * the one at the foot of `_.gif` (PLAN Task 6).
 *
 * Rendered by `App.tsx` as normal in-flow chrome inside `.crt-content`, below
 * the routed page — not through `CrtFrame`'s `floatingChrome` slot, because
 * unlike Task 5's `MobileTabBar` this footer is not `position: fixed`; it has
 * no reason to escape `.crt-content`'s filter (see `CrtFrame`'s comment).
 *
 * Mobile clearance: below 768px `MobileTabBar` (Task 5) *is* fixed to the
 * viewport bottom, so it can occlude whatever is last in normal flow — this
 * footer's wordmark row. `pb-20` on the outer wrapper reserves space at least
 * as tall as that bar (~72px: two boxed-label rows plus padding) so the
 * wordmark clears it; `md:pb-6` drops back to a normal gutter once the tab
 * bar is gone at `md:` and up.
 *
 * `EXTENTION` (row 3) is the misspelling the PLAN's reference metadata block
 * uses verbatim (`eva-magi-1.png`) — kept as show-accurate flavour text, not
 * fixed, matching Task 6's brief.
 * ------------------------------------------------------------------------- */
import { LINKS } from '../../content/links'
import { BoxedLabel } from '../ui/BoxedLabel'
import { HatchBar } from '../ui/HatchBar'
import { HazardStripe } from '../ui/HazardStripe'
import { MetaBlock } from '../ui/MetaBlock'

const META_ROWS: Array<[string, string]> = [
  ['CODE', '01'],
  ['FILE', 'PORTFOLIO_SYS'],
  ['EXTENTION', '2026'],
  ['EX_MODE', 'ON'],
  ['PRIORITY', 'AAA'],
]

export function HudFooter() {
  return (
    <footer className="relative z-10 pb-20 md:pb-6">
      <HazardStripe height={10} />

      <div className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-end md:justify-between md:px-6">
        <MetaBlock rows={META_ROWS} />

        <nav aria-label="Contact" className="flex flex-wrap gap-3">
          {LINKS.map((link) => {
            const external = link.kind !== 'email'
            return (
              <BoxedLabel
                key={link.href}
                as="a"
                href={link.href}
                target={external ? '_blank' : undefined}
              >
                {link.label}
              </BoxedLabel>
            )
          })}
        </nav>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="font-display display-compressed text-magi text-glow-magi text-2xl leading-none uppercase">
            NERV
          </span>
          <HatchBar tone="magi" className="w-28" />
        </div>
      </div>
    </footer>
  )
}
