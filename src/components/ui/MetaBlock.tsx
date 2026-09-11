/* ---------------------------------------------------------------------------
 * MetaBlock — the CODE / FILE / EXTENTION / EX_MODE / PRIORITY stack that sits
 * under the 提訴 header in `eva-magi-1.png` and `eva-magi-2.png`.
 *
 * Mono, orange, tracked out, and — in every reference — the first row is set
 * two sizes larger than the rest ("CODE : 239"), which is what makes the block
 * read as a slug line rather than a table. `data-row` exposes the index so a
 * page can re-style the emphasis without forking the component.
 *
 * Marked up as a description list: the label is the term, the value the
 * description. The separating colon is decorative and hidden, so a screen
 * reader hears "CODE, 239" instead of "CODE colon 239".
 * ------------------------------------------------------------------------- */
import { cn } from '../../lib/cn'

export type MetaBlockRow = [label: string, value: string]

export type MetaBlockProps = {
  rows: MetaBlockRow[]
  className?: string
}

export function MetaBlock({ rows, className }: MetaBlockProps) {
  return (
    <dl
      className={cn(
        'font-mono text-nerv text-glow-nerv tracking-telemetry uppercase',
        className,
      )}
      data-testid="meta-block"
    >
      {rows.map(([label, value], index) => (
        <div
          key={`${label}-${index}`}
          className={cn(
            'flex items-baseline gap-1.5 leading-tight',
            index === 0 ? 'text-xl' : 'text-xs',
          )}
          data-row={index}
        >
          <dt>{label}</dt>
          <span aria-hidden="true">:</span>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
