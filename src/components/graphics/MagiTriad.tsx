/* ---------------------------------------------------------------------------
 * MagiTriad — the three-slab MAGI deliberation plate of `eva-magi-1.png`.
 *
 * PLAN Task 9 (as revised by R2). The reference does NOT show small pentagons
 * in a 12-column grid. Measured off the PNG (mint mask → convex hull →
 * simplified polygons) it is:
 *
 *   - three large mint slabs, each a rectangle with its hub-facing corner(s)
 *     cut at a true 45°;
 *   - a ⅄-shaped black channel between them: one wide trunk running straight
 *     down from the junction, two narrow arms running up-left and up-right;
 *   - where the three meet, a small black hexagonal void — the hub — carrying
 *     `MAGI` in orange. The only orange-on-black text in the plate;
 *   - three short, thick orange bars bridging the slabs across each channel at
 *     the hub's three open corners, which is what closes the hexagon visually.
 *
 * Geometry note worth keeping. The trunk's width and the hub's width are the
 * SAME number and cannot be decoupled: the hub's left wall IS the left slab's
 * right edge and its right wall IS the right slab's left edge, and those two
 * edges stay parallel all the way down. So "all three gutters equal" is not
 * constructible with 45° chamfers, and the reference does not do it either —
 * it measures 117 px of trunk against 38 px of arm. The two arms are narrow
 * and equal; the trunk is the hub channel. Every number below is in
 * `eva-magi-1.png`'s own pixel scale, which lands ~1:1 on these design units.
 *
 * Built from `MagiPanel`s positioned with CSS, never raw SVG, so the names
 * stay DOM text: selectable, translatable and in the a11y tree. Sizing is in
 * `cqw` against the root container so every length — including the chamfer,
 * which must be equal px on both axes to stay at 45° — scales with the
 * component and nothing is pinned to px.
 * ------------------------------------------------------------------------- */
import type { CSSProperties } from 'react'
import { useFx } from '../../fx/useFx'
import { MagiPanel, type MagiPanelVariant } from '../ui/MagiPanel'
import { cn } from '../../lib/cn'

export type MagiUnitState = 'pending' | 'approved' | 'denied'

export type MagiUnit = {
  /** `MELCHIOR`, `BALTHASAR`, `CASPER` — rendered large, black, tracked out. */
  name: string
  index: 1 | 2 | 3
  state: MagiUnitState
}

export type MagiTriadProps = {
  /** `[top, left, right]` — the reference's BALTHASAR / CASPER / MELCHIOR. */
  units?: readonly [MagiUnit, MagiUnit, MagiUnit]
  /** Hub text. The plate's only orange-on-black string. */
  hubLabel?: string
  /** Degrees of tilt for the whole plate; the reference sits a few off true. */
  rotate?: number
  className?: string
}

/* -- geometry, in design units on a PLATE_W × PLATE_H plate ---------------- */

const HUB = 120 /* hub width == the trunk channel's width (see header note) */
const ARM = 38 /* the two diagonal channels; 0.32 × hub, as in the reference */
const RIM = 4 /* orange slab rim; the reference's edge fringe is 3–4 px     */
const BAR = 11 /* connector bar thickness ≈ 0.09 × hub, off the reference   */
const BAR_OVERLAP = 4 /* bars run a hair past both walls so they never gap  */

const TOP_W = 400
const TOP_H = 300
const TOP_CUT = 140 /* == (TOP_W − HUB) / 2, so the flat bottom IS the hub top */

const SIDE_W = 300
const SIDE_H = 215
const SIDE_CUT = 110

const PLATE_W = 2 * SIDE_W + HUB
const HUB_TOP = TOP_H
/* A 45° arm wall offset by ARM meets the inner edge ARM·√2 further down. */
const ARM_DROP = ARM * Math.SQRT2
const SIDE_TOP = HUB_TOP + ARM_DROP - SIDE_CUT
const PLATE_H = SIDE_TOP + SIDE_H
const TOP_LEFT = (PLATE_W - TOP_W) / 2
const HUB_LEFT = (PLATE_W - HUB) / 2
/* Hub floor: 0.71 × hub width below its ceiling, measured off the reference. */
const HUB_BAR_Y = HUB_TOP + 0.71 * HUB
/* Arm bars sit 0.56 × hub width back from the hub, again off the reference. */
const ARM_BACK = (0.56 * HUB) / Math.SQRT2
const ARM_BAR_X = HUB_LEFT - ARM_BACK
const ARM_BAR_Y = HUB_TOP + ARM_DROP / 2 - ARM_BACK

/* -- type sizing ----------------------------------------------------------
 * The names must fit the flat inner width of their slab whatever font
 * resolves. `font-display` is "Barlow Condensed", Impact, "Arial Narrow",
 * sans-serif; if the webfont is blocked AND neither narrow system face
 * exists, the generic `sans-serif` is roughly 1.6× wider per character, and a
 * size tuned for Barlow overflows into the hub. So the size is DERIVED from
 * the geometry and the actual name lengths against a worst-case advance,
 * never guessed from one font's metrics.
 *
 * Measured advance per uppercase character, in em, including the 0.025em of
 * `tracking-wide`, for "MELCHIOR·1":
 *   FreeSans Bold 0.628 · Liberation/Arial Bold 0.645 · DejaVu Sans Bold 0.718
 * 0.82 clears all of them and also Verdana Bold (~0.795), the widest face
 * that ever resolves as a default `sans-serif`.                            */
const WORST_ADVANCE_EM = 0.82
/** House horizontal compression — the `.display-compressed` value in base.css.
 *  Buys ~22% more cap height at the same laid-out width, and makes a fallback
 *  font read narrow like the condensed face the reference uses. */
const NAME_SCALE = 0.82
/** Ceiling on the derived size: the reference's own 0.19 × slab height. With
 *  the three MAGI names it is never the binding constraint — `MELCHIOR·1` in a
 *  side slab caps the size at ≈0.14 × slab height — but it stops a short name
 *  like `CASPER·3` ballooning past the reference proportion on its own. */
const TITLE_MAX = 57
const HUB_TITLE_MAX = 44 /* MAGI; ≈0.22 × hub width, as in the reference */
/** Horizontal interior padding, in design units (replaces MagiPanel's 1rem). */
const PAD_X = 4
/** Flat inner width a name may occupy, once rim and padding are removed. */
const SIDE_FLAT = SIDE_W - 2 * RIM - 2 * PAD_X
const TOP_FLAT = TOP_W - 2 * RIM - 2 * PAD_X
const HUB_FLAT = HUB - 2 * PAD_X

/** Share of the flat width held back, so that `u()`'s 4-decimal rounding and
 *  the browser's own sub-pixel rounding can never turn "exactly fits" into
 *  "one pixel over". */
const FIT_SAFETY = 0.99

/** Largest font size at which `chars` characters still fit `flat`. */
function fitSize(flat: number, chars: number): number {
  return (flat * FIT_SAFETY) / (chars * WORST_ADVANCE_EM * NAME_SCALE)
}

/** What MagiPanel actually lays out: the name plus its `·N` index suffix. */
function nameLength(unit: MagiUnit): number {
  return `${unit.name}·${unit.index}`.length
}

/** One size shared by all three slabs — the reference sets them equal — small
 *  enough that the longest name fits the narrowest slab in any font. */
function titleSize(units: readonly [MagiUnit, MagiUnit, MagiUnit]): number {
  const [top, left, right] = units
  return Math.min(
    TITLE_MAX,
    fitSize(TOP_FLAT, nameLength(top)),
    fitSize(SIDE_FLAT, nameLength(left)),
    fitSize(SIDE_FLAT, nameLength(right)),
  )
}

/* Interior sizes, and how far the 45° cut reaches into each interior (the rim
   shrinks it by b(2−√2), same as the interior clip). The names are padded
   clear of that cut rather than centred through it, which is both where the
   reference puts them — about two thirds down a side slab, just above the cut
   on the top slab — and what frees the FULL flat width for them. */
const SIDE_INNER_H = SIDE_H - 2 * RIM
const TOP_INNER_H = TOP_H - 2 * RIM
const SIDE_INNER_CUT = SIDE_CUT - 0.5857864 * RIM
const TOP_INNER_CUT = TOP_CUT - 0.5857864 * RIM
/** Breathing room between a name and the cut it must clear. */
const CUT_CLEARANCE = 20

/**
 * Padding on the cut side that keeps a centred title of `size` off the cut.
 * The title centres in the box left after padding, so its near edge sits at
 * `(innerH − pad)/2 − size/2` from the far side; that must clear `cut`.
 */
function padClearingCut(innerH: number, cut: number, size: number): number {
  return Math.max(PAD_X, 2 * cut + size - innerH + CUT_CLEARANCE)
}

/** Design units → a percentage of the container's inline size. */
function u(n: number): string {
  return `${((n / PLATE_W) * 100).toFixed(4)}cqw`
}

/** Largest scale at which the plate, rotated by `deg`, still fits its box. */
function fitScale(deg: number): number {
  const a = (Math.abs(deg) * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return Math.min(
    PLATE_W / (PLATE_W * cos + PLATE_H * sin),
    PLATE_H / (PLATE_W * sin + PLATE_H * cos),
  )
}

/** Inline styles that also set CSS custom properties. */
type StyleVars = CSSProperties & Record<`--${string}`, string>

const VARIANT: Record<MagiUnitState, MagiPanelVariant> = {
  pending: 'outline',
  approved: 'filled',
  denied: 'denied',
}

/** Screen-reader wording for a state; the colour flip alone is not enough. */
const STATE_LABEL: Record<MagiUnitState, string> = {
  pending: 'DELIBERATING',
  approved: 'APPROVED',
  denied: 'DENIED',
}

const DEFAULT_UNITS: readonly [MagiUnit, MagiUnit, MagiUnit] = [
  { name: 'BALTHASAR', index: 2, state: 'pending' },
  { name: 'CASPER', index: 3, state: 'pending' },
  { name: 'MELCHIOR', index: 1, state: 'pending' },
]

/** One of the three orange bars bridging a channel. Decorative. */
function ConnectorBar({
  centreX,
  centreY,
  length,
  rotate,
}: {
  centreX: number
  centreY: number
  length: number
  rotate: number
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="magi-triad-connector"
      className="absolute bg-nerv"
      style={{
        left: u(centreX - length / 2),
        top: u(centreY - BAR / 2),
        width: u(length),
        height: u(BAR),
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    />
  )
}

export function MagiTriad({
  units = DEFAULT_UNITS,
  hubLabel = 'MAGI',
  rotate = 3,
  className,
}: MagiTriadProps) {
  const { motionOn } = useFx()
  const [top, left, right] = units
  const title = titleSize(units)

  const slabs = [
    {
      unit: top,
      chamfer: ['bottom-left', 'bottom-right'] as const,
      box: {
        left: TOP_LEFT,
        top: 0,
        width: TOP_W,
        height: TOP_H,
        cut: TOP_CUT,
      },
      /* hold the name above the two bottom cuts */
      pad: [PAD_X, PAD_X, padClearingCut(TOP_INNER_H, TOP_INNER_CUT, title)],
    },
    {
      unit: left,
      chamfer: ['top-right'] as const,
      box: {
        left: 0,
        top: SIDE_TOP,
        width: SIDE_W,
        height: SIDE_H,
        cut: SIDE_CUT,
      },
      /* push the name below the top cut */
      pad: [padClearingCut(SIDE_INNER_H, SIDE_INNER_CUT, title), PAD_X, PAD_X],
    },
    {
      unit: right,
      chamfer: ['top-left'] as const,
      box: {
        left: PLATE_W - SIDE_W,
        top: SIDE_TOP,
        width: SIDE_W,
        height: SIDE_H,
        cut: SIDE_CUT,
      },
      pad: [padClearingCut(SIDE_INNER_H, SIDE_INNER_CUT, title), PAD_X, PAD_X],
    },
  ]

  const plateStyle: StyleVars = {
    transform: `rotate(${rotate}deg) scale(${fitScale(rotate).toFixed(4)})`,
    '--magi-panel-border': u(RIM),
    '--magi-panel-title': u(title),
    '--magi-panel-title-scale': String(NAME_SCALE),
  }

  return (
    <div
      className={cn('relative w-full', className)}
      style={{
        containerType: 'inline-size',
        aspectRatio: `${PLATE_W} / ${PLATE_H.toFixed(3)}`,
      }}
      role="group"
      aria-label="MAGI deliberation"
      data-testid="magi-triad"
      data-motion={motionOn ? 'on' : 'off'}
    >
      <div className="absolute inset-0" style={plateStyle}>
        {slabs.map(({ unit, chamfer, box, pad }) => {
          const slotStyle: StyleVars = {
            left: u(box.left),
            top: u(box.top),
            width: u(box.width),
            height: u(box.height),
            '--magi-chamfer': u(box.cut),
            '--magi-panel-pad': pad.map(u).join(' '),
          }
          return (
            <div
              key={unit.name}
              className="absolute"
              style={slotStyle}
              data-testid="magi-triad-slab"
              data-state={unit.state}
            >
              <MagiPanel
                variant={VARIANT[unit.state]}
                title={unit.name}
                index={unit.index}
                chamfer={chamfer}
                /* Gated per Global Constraints: with motion off the slab flips
                   colour instantly instead of easing. */
                className={cn(
                  'h-full w-full',
                  motionOn && 'transition-colors duration-500 ease-out',
                )}
              >
                <span className="sr-only">{STATE_LABEL[unit.state]}</span>
              </MagiPanel>
            </div>
          )
        })}

        <ConnectorBar
          centreX={PLATE_W / 2}
          centreY={HUB_BAR_Y}
          length={HUB + BAR_OVERLAP}
          rotate={0}
        />
        <ConnectorBar
          centreX={ARM_BAR_X}
          centreY={ARM_BAR_Y}
          length={ARM + BAR_OVERLAP}
          rotate={-45}
        />
        <ConnectorBar
          centreX={PLATE_W - ARM_BAR_X}
          centreY={ARM_BAR_Y}
          length={ARM + BAR_OVERLAP}
          rotate={45}
        />

        <p
          className="text-glow-nerv absolute flex items-center justify-center font-display leading-none tracking-wide text-nerv uppercase"
          data-testid="magi-triad-hub"
          style={{
            left: u(HUB_LEFT),
            top: u(HUB_TOP),
            width: u(HUB),
            height: u(HUB_BAR_Y - HUB_TOP),
            fontSize: u(
              Math.min(HUB_TITLE_MAX, fitSize(HUB_FLAT, hubLabel.length)),
            ),
            transform: `scaleX(${NAME_SCALE})`,
          }}
        >
          {hubLabel}
        </p>
      </div>
    </div>
  )
}
