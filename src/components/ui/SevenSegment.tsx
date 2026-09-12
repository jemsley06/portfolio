/* ---------------------------------------------------------------------------
 * SevenSegment — the countdown read-out from `eva-timer.gif`
 * ("ACTIVE TIME REMAINING: 5:00:00").
 *
 * Geometry measured off the GIF: each digit is ~90×180 device px, i.e. a 1:1.9
 * cell; the bars are ~0.22 of the cell width and their ends are mitred at 45°,
 * so a segment is a flattened hexagon, not a rectangle. The mitres leave the
 * diamond-shaped notches between neighbouring segments that give the display
 * its mechanical look. `strokeLinejoin="round"` rounds the polygon corners the
 * way phosphor smears them on the tube.
 *
 * Lit segments are `nerv-hot` and wear `.crt-bloom` — the one place the PLAN
 * asks for the SVG bloom filter. Unlit segments are NOT hidden: the reference
 * shows every dormant bar as a dark ghost, so they are drawn in the PLAN's
 * unlit colour, expressed against tokens instead of a literal `#2a1a08`
 * (`nerv` mixed 25% into `ink`, held at 70% opacity ≈ #2e1c08).
 *
 * Unsupported characters: `' '` renders an empty cell (a blank the width of a
 * digit, no ghosts) and any other character renders the ghost frame with every
 * segment unlit — the display never throws and never drops a character, so a
 * caller's string width is always preserved. The literal value is exposed to
 * assistive tech; the SVG cells are decoration.
 * ------------------------------------------------------------------------- */
import { cn } from '../../lib/cn'

export type SevenSegmentTone = 'nerv' | 'alert'

export type SevenSegmentProps = {
  /** Digits `0-9`, `:` and spaces, e.g. `"4:59:56"`. */
  value: string
  /** Cell height in px (default 48). */
  size?: number
  tone?: SevenSegmentTone
  className?: string
}

/* --- cell geometry (user units; the cell is scaled to `size`) ------------- */
const CELL_W = 100
const CELL_H = 190
const COLON_W = 44
const PAD = 6
/** Bar thickness — 0.20 of the cell width, matching the GIF. */
const T = 20
/** Mitre gap between neighbouring bars. */
const GAP = 3.5
const MID = CELL_H / 2

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

/*      a
 *    ┌───┐
 *  f │   │ b
 *    ├─g─┤
 *  e │   │ c
 *    └───┘
 *      d
 */
const SEGMENT_MAP: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

const point = (x: number, y: number) => `${x},${y}`

/** Horizontal bar: a hexagon mitred to a point at each end. */
function horizontalBar(x0: number, x1: number, y: number): string {
  const left = x0 + GAP
  const right = x1 - GAP
  const h = T / 2
  return [
    point(left, y),
    point(left + h, y - h),
    point(right - h, y - h),
    point(right, y),
    point(right - h, y + h),
    point(left + h, y + h),
  ].join(' ')
}

/** Vertical bar: the same hexagon on its side. */
function verticalBar(y0: number, y1: number, x: number): string {
  const top = y0 + GAP
  const bottom = y1 - GAP
  const h = T / 2
  return [
    point(x, top),
    point(x + h, top + h),
    point(x + h, bottom - h),
    point(x, bottom),
    point(x - h, bottom - h),
    point(x - h, top + h),
  ].join(' ')
}

const SEGMENT_POINTS: Record<Segment, string> = {
  a: horizontalBar(PAD, CELL_W - PAD, PAD + T / 2),
  g: horizontalBar(PAD, CELL_W - PAD, MID),
  d: horizontalBar(PAD, CELL_W - PAD, CELL_H - PAD - T / 2),
  f: verticalBar(PAD, MID, PAD + T / 2),
  b: verticalBar(PAD, MID, CELL_W - PAD - T / 2),
  e: verticalBar(MID, CELL_H - PAD, PAD + T / 2),
  c: verticalBar(MID, CELL_H - PAD, CELL_W - PAD - T / 2),
}

const SEGMENT_ORDER: Segment[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

const LIT_FILL: Record<SevenSegmentTone, string> = {
  nerv: 'var(--color-nerv-hot)',
  alert: 'var(--color-alert)',
}

/** The PLAN's `#2a1a08` ghost, written against tokens. */
const UNLIT_FILL = 'color-mix(in srgb, var(--color-nerv) 25%, var(--color-ink))'
const UNLIT_OPACITY = 0.7

function Cell({
  char,
  size,
  tone,
  index,
}: {
  char: string
  size: number
  tone: SevenSegmentTone
  index: number
}) {
  const scale = size / CELL_H

  if (char === ' ') {
    return (
      <span
        style={{ width: `${COLON_W * scale}px`, height: `${size}px` }}
        data-cell="space"
        data-index={index}
        aria-hidden="true"
      />
    )
  }

  if (char === ':') {
    const dot = T
    const x = (COLON_W - dot) / 2
    return (
      <svg
        width={COLON_W * scale}
        height={size}
        viewBox={`0 0 ${COLON_W} ${CELL_H}`}
        className="crt-bloom overflow-visible"
        data-cell="colon"
        data-index={index}
        aria-hidden="true"
        focusable="false"
      >
        {[CELL_H * 0.34, CELL_H * 0.66].map((y) => (
          <rect
            key={y}
            x={x}
            y={y - dot / 2}
            width={dot}
            height={dot}
            rx={dot * 0.25}
            fill={LIT_FILL[tone]}
          />
        ))}
      </svg>
    )
  }

  const lit = SEGMENT_MAP[char] ?? ''

  return (
    <svg
      width={CELL_W * scale}
      height={size}
      viewBox={`0 0 ${CELL_W} ${CELL_H}`}
      className="overflow-visible"
      data-cell="digit"
      data-char={char}
      data-known={char in SEGMENT_MAP}
      data-index={index}
      aria-hidden="true"
      focusable="false"
    >
      {/* Ghosts first: every dormant bar, exactly as the tube shows them. */}
      <g fill={UNLIT_FILL} fillOpacity={UNLIT_OPACITY} data-lit="false">
        {SEGMENT_ORDER.filter((segment) => !lit.includes(segment)).map(
          (segment) => (
            <polygon
              key={segment}
              points={SEGMENT_POINTS[segment]}
              data-segment={segment}
              stroke={UNLIT_FILL}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ),
        )}
      </g>
      <g
        className="crt-bloom"
        fill={LIT_FILL[tone]}
        stroke={LIT_FILL[tone]}
        strokeWidth={2}
        strokeLinejoin="round"
        data-lit="true"
      >
        {SEGMENT_ORDER.filter((segment) => lit.includes(segment)).map(
          (segment) => (
            <polygon
              key={segment}
              points={SEGMENT_POINTS[segment]}
              data-segment={segment}
            />
          ),
        )}
      </g>
    </svg>
  )
}

export function SevenSegment({
  value,
  size = 48,
  tone = 'nerv',
  className,
}: SevenSegmentProps) {
  return (
    <span
      className={cn('inline-flex items-end', className)}
      /* The gap tracks the cell, not the inherited font-size: an `em` here
         would collapse to a hairline on a 16px parent. */
      style={{ gap: `${Math.round(size * 8) / 100}px` }}
      data-testid="seven-segment"
      data-value={value}
      data-tone={tone}
    >
      <span className="sr-only">{value}</span>
      {[...value].map((char, index) => (
        <Cell
          key={`${char}-${index}`}
          char={char}
          size={size}
          tone={tone}
          index={index}
        />
      ))}
    </span>
  )
}
