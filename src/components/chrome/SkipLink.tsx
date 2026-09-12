/* ---------------------------------------------------------------------------
 * SkipLink — the first interactive element in the DOM (WCAG 2.4.1 "Bypass
 * Blocks"). Invisible until focused, then it snaps into view in the boxed
 * orange chip look shared with `BoxedLabel`.
 *
 * Targets `#main`. Pages are still `<h1>` stubs (Task 1) — none of them
 * render `<main id="main">` yet, so this link is *correct* but its target
 * does not exist until Task 11+ gives every page a `<main id="main">`
 * landmark. That is a requirement on later tasks, not a bug here.
 *
 * Positioning: `focus:absolute` rather than `focus:fixed`. `SkipLink` is
 * rendered inside `.crt-content`, which carries a CSS `filter` (Task 3) and
 * is therefore the containing block for `position: fixed` descendants — a
 * fixed skip link would anchor to `.crt-content`'s own (possibly taller than
 * the viewport) box and could scroll away with the page instead of tracking
 * the viewport. `.crt-content` is also `position: relative`, so `absolute`
 * positions correctly against it with none of that risk, and since the skip
 * link is only ever reached by the very first Tab press (before any scroll
 * has happened) it reads as pinned to the corner in practice.
 * ------------------------------------------------------------------------- */
import { BoxedLabel } from '../ui/BoxedLabel'

export function SkipLink() {
  return (
    <BoxedLabel
      as="a"
      href="#main"
      tone="nerv"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:bg-ink"
    >
      SKIP TO MAIN CONTENT
    </BoxedLabel>
  )
}
