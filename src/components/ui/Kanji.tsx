/* ---------------------------------------------------------------------------
 * Kanji — a Noto Sans JP accent over its English gloss: 内部 / INTERNAL and
 * 主電源供給システム / MAIN ENERGY SUPPLY SYSTEM in `eva-timer.gif`, and the nav's
 * 本部 / HOME sub-labels.
 *
 * Accessibility. The kanji stays in the accessibility tree (hiding it would
 * lose it for Japanese screen-reader users) but is tagged `lang="ja"`, so a
 * multilingual reader switches voice instead of spelling the glyphs out in
 * English; the English line follows immediately as the gloss every other user
 * hears. The pair is one `<span>` group so it is announced together.
 * ------------------------------------------------------------------------- */
import { cn } from '../../lib/cn'

export type KanjiTone = 'nerv' | 'acid' | 'alert'

export type KanjiProps = {
  jp: string
  en: string
  tone?: KanjiTone
  className?: string
}

const TONE: Record<KanjiTone, string> = {
  nerv: 'text-nerv text-glow-nerv',
  acid: 'text-acid text-glow-acid',
  alert: 'text-alert text-glow-alert',
}

export function Kanji({ jp, en, tone = 'nerv', className }: KanjiProps) {
  return (
    <span
      className={cn('inline-flex flex-col leading-none', TONE[tone], className)}
      data-testid="kanji"
      data-tone={tone}
    >
      <span className="kanji text-2xl" lang="ja">
        {jp}
      </span>
      <span className="font-mono text-[0.65rem] tracking-telemetry uppercase">
        {en}
      </span>
    </span>
  )
}
