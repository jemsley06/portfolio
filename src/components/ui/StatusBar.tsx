/* ---------------------------------------------------------------------------
 * StatusBar — the bracketed header bars stacked at the top of
 * `Evangelion UI - Magi report.jpeg` ("DIRECT LINK CONNECTION: MAGI 01",
 * "RESULT OF THE DELIBERATION"). The same motif frames the 私は大丈夫 banner in
 * `_.gif`: a thin rule around condensed capitals with a fat rounded bracket
 * standing at each end.
 *
 * The brackets are pure decoration (`aria-hidden`) and are drawn with
 * `bg-current`, so a tone change moves rule, text and brackets together.
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
        className="w-1.5 shrink-0 rounded-full bg-current"
        data-bracket="start"
        aria-hidden="true"
      />
      <span className="font-display flex-1 self-center text-lg leading-none tracking-wide uppercase">
        {children}
      </span>
      <span
        className="w-1.5 shrink-0 rounded-full bg-current"
        data-bracket="end"
        aria-hidden="true"
      />
    </div>
  )
}
