/* ---------------------------------------------------------------------------
 * StatusBar — the bracketed header bars stacked at the top of
 * `Evangelion UI - Magi report.jpeg` ("DIRECT LINK CONNECTION: MAGI 01",
 * "RESULT OF THE DELIBERATION"). The same motif frames the status banner in
 * `_.gif`: a thin rule around condensed capitals with a fat rounded bracket
 * standing at each end.
 *
 * The brackets are pure decoration (`aria-hidden`) and are drawn with
 * `bg-current`, so a tone change moves rule, text and brackets together. Both
 * brackets are explicitly `self-stretch` so they always span the bar's full
 * height, including a bar whose text has wrapped to two lines.
 *
 * R5 defect #3: long content used to escape the bracketed frame once it
 * wrapped to a second line. The label span is a flex item (`flex-1`), and
 * flex items default to `min-width: auto` — that floors their shrink at the
 * content's intrinsic (unbroken) width, so a long label refused to shrink
 * enough to wrap inside the bar and instead overflowed past the border. The
 * fix is the standard one: `min-w-0` on the label lets it shrink to the
 * container and wrap normally, and the row keeps no fixed height so it grows
 * to fit however many lines that takes.
 * ------------------------------------------------------------------------- */
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type StatusBarTone = 'nerv' | 'alert'

export type StatusBarProps = {
  children: ReactNode
  tone?: StatusBarTone
  className?: string
}

const TONE: Record<StatusBarTone, string> = {
  nerv: 'border-nerv text-nerv text-glow-nerv',
  alert: 'border-alert text-alert text-glow-alert',
}

export function StatusBar({
  children,
  tone = 'nerv',
  className,
}: StatusBarProps) {
  return (
    <div
      className={cn(
        'flex items-stretch gap-2 border px-1.5 py-1',
        TONE[tone],
        className,
      )}
      data-testid="status-bar"
      data-tone={tone}
    >
      <span
        className="w-1.5 shrink-0 self-stretch rounded-full bg-current"
        data-bracket="start"
        aria-hidden="true"
      />
      <span
        className="font-display min-w-0 flex-1 self-center text-lg leading-none tracking-wide uppercase"
        data-testid="status-bar-label"
      >
        {children}
      </span>
      <span
        className="w-1.5 shrink-0 self-stretch rounded-full bg-current"
        data-bracket="end"
        aria-hidden="true"
      />
    </div>
  )
}
