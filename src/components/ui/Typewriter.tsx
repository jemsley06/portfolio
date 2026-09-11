/* ---------------------------------------------------------------------------
 * Typewriter — reveals a line of text character by character, the way NERV
 * terminals spool their status lines.
 *
 * Motion gate (PLAN § Motion rules): the reveal runs only when `motionOn`. Off
 * — FX toggled off or `prefers-reduced-motion` — the full string is painted on
 * the first render and `onDone` fires immediately, so nothing downstream ever
 * waits on an animation that will not happen. `useFx()` works without a
 * provider, so this is safe in isolation.
 *
 * Accessibility: the finished string sits in a screen-reader-only span, and the
 * animating copy is `aria-hidden`. Without that split, every tick would be an
 * accessibility-tree mutation and readers would stutter the line out letter by
 * letter. The caret blinks at 0.5 Hz (Tailwind's `animate-pulse`), far under
 * the 3 Hz ceiling, and only while characters are still arriving.
 *
 * The reveal is stored as `{ text, count }` rather than a bare counter, so a
 * new `text` prop derives back to zero characters during render instead of
 * needing a state reset inside an effect (which cascades a second render).
 * ------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { useFx } from '../../fx/useFx'
import { cn } from '../../lib/cn'

export type TypewriterProps = {
  text: string
  /** Characters per second (default 28 — a brisk terminal spool). */
  cps?: number
  onDone?: () => void
  className?: string
}

/** Faster than this and the interval just burns frames without reading faster. */
const MIN_STEP_MS = 16

/** The characters revealed so far, tagged with the string they belong to. */
type Reveal = { text: string; count: number }

export function Typewriter({
  text,
  cps = 28,
  onDone,
  className,
}: TypewriterProps) {
  const { motionOn } = useFx()
  const [reveal, setReveal] = useState<Reveal>(() => ({ text, count: 0 }))

  /* `onDone` is read through a ref so a caller passing an inline arrow does not
     restart the reveal on every render. */
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!motionOn || text.length === 0) {
      onDoneRef.current?.()
      return
    }

    let revealed = 0
    const step = Math.max(MIN_STEP_MS, 1000 / Math.max(cps, 1))
    const timer = setInterval(() => {
      revealed += 1
      setReveal({ text, count: revealed })
      if (revealed >= text.length) {
        clearInterval(timer)
        onDoneRef.current?.()
      }
    }, step)

    return () => clearInterval(timer)
  }, [text, cps, motionOn])

  /* Motion off: the whole line, immediately. Motion on: whatever the current
     run has revealed — a stale run (the `text` prop just changed) counts as
     zero, so the line never flashes the previous string's tail. */
  const count = motionOn
    ? reveal.text === text
      ? reveal.count
      : 0
    : text.length
  const typing = count < text.length

  return (
    <span className={cn('inline-block', className)} data-testid="typewriter">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-testid="typewriter-visible">
        {text.slice(0, count)}
        {typing && (
          <span className="animate-pulse" data-testid="typewriter-caret">
            ▌
          </span>
        )}
      </span>
    </span>
  )
}
