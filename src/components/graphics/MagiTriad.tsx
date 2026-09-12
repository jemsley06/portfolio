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

const TITLE = 57 /* name size; ≈0.19 × slab height, as in the reference */
const HUB_TITLE = 44 /* MAGI; ≈0.22 × hub width, as in the reference */

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
    },
  ]

  const plateStyle: StyleVars = {
    transform: `rotate(${rotate}deg) scale(${fitScale(rotate).toFixed(4)})`,
    '--magi-panel-border': u(RIM),
    '--magi-panel-title': u(TITLE),
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
        {slabs.map(({ unit, chamfer, box }) => {
          const slotStyle: StyleVars = {
            left: u(box.left),
            top: u(box.top),
            width: u(box.width),
            height: u(box.height),
            '--magi-chamfer': u(box.cut),
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
            fontSize: u(HUB_TITLE),
          }}
        >
          {hubLabel}
        </p>
      </div>
    </div>
  )
}
