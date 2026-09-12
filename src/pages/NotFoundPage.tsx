/* ---------------------------------------------------------------------------
 * NotFoundPage — the catch-all `*` route (PLAN R1 checklist item).
 *
 * A `denied` MagiPanel doubling as the 404 read: `PATTERN: UNKNOWN` /
 * `CODE: 404` in place of a project name, plus a link back to `HOME`. English
 * only, per R1 — no kanji stamp or sub-label.
 * ------------------------------------------------------------------------- */
import { BoxedLabel } from '../components/ui/BoxedLabel'
import { MagiPanel } from '../components/ui/MagiPanel'

export default function NotFoundPage() {
  return (
    <main
      id="main"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-8 p-8 text-center"
    >
      <MagiPanel
        variant="denied"
        title="PATTERN: UNKNOWN"
        stamp="DENIED"
        className="h-64 w-64"
      >
        <p className="font-mono tracking-telemetry text-sm">CODE: 404</p>
      </MagiPanel>
      <BoxedLabel as="a" href="/" tone="nerv">
        RETURN TO HOME
      </BoxedLabel>
    </main>
  )
}
