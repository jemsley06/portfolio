import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MagiTriad, type MagiUnit } from './MagiTriad'

/* ---------------------------------------------------------------------------
 * Text-fit guards.
 *
 * jsdom does no text layout: every `offsetWidth` / `getBoundingClientRect()`
 * is 0, so "render it and measure the glyphs" is not available here. These
 * tests instead re-derive the fit ARITHMETICALLY from what the component
 * emits — slab width, rim, the `--magi-panel-pad` shorthand, the chamfer, the
 * title size and its scale are all in the DOM — and check it against a
 * worst-case advance width. That is what actually broke: a title size tuned
 * for Barlow Condensed overflowed once the webfont was blocked and a wide
 * generic sans resolved instead.
 *
 * Measured advance per uppercase character, in em, including the 0.025em of
 * `tracking-wide`: FreeSans Bold 0.628, Liberation/Arial Bold 0.645, DejaVu
 * Sans Bold 0.718. 0.82 clears all of them plus Verdana Bold (~0.795).
 * ------------------------------------------------------------------------- */
const WIDEST_BOLD_SANS_EM = 0.82
/** The rim shrinks a 45° cut by b(2−√2); MagiPanel's CHAMFER_INNER does this. */
const CHAMFER_RIM_FACTOR = 0.5857864

/** A `cqw` length, back in the plate's own design units. */
function toUnits(value: string, plateWidth: number): number {
  return (parseFloat(value) / 100) * plateWidth
}

function readPlate(triad: HTMLElement) {
  const plate = triad.firstElementChild as HTMLElement
  const plateWidth = parseFloat(triad.style.aspectRatio.split('/')[0])
  const px = (v: string) => toUnits(v, plateWidth)
  return {
    plateWidth,
    px,
    rim: px(plate.style.getPropertyValue('--magi-panel-border')),
    title: px(plate.style.getPropertyValue('--magi-panel-title')),
    scale: parseFloat(plate.style.getPropertyValue('--magi-panel-title-scale')),
  }
}

function readSlabs(triad: HTMLElement) {
  const { px, rim, title, scale } = readPlate(triad)
  return screen.getAllByTestId('magi-triad-slab').map((slot) => {
    const pad = slot.style
      .getPropertyValue('--magi-panel-pad')
      .trim()
      .split(/\s+/)
      .map(px)
    const [padTop, padX, padBottom] = pad
    const innerHeight = px(slot.style.height) - 2 * rim
    const cut = px(slot.style.getPropertyValue('--magi-chamfer'))
    const centre = (padTop + (innerHeight - padBottom)) / 2
    return {
      /* flat width a name may occupy: slab, less both rims and both paddings */
      flat: px(slot.style.width) - 2 * rim - 2 * padX,
      innerHeight,
      innerCut: cut - CHAMFER_RIM_FACTOR * rim,
      textTop: centre - title / 2,
      textBottom: centre + title / 2,
      title,
      scale,
      chamfer: (slot.querySelector('[data-testid="magi-panel"]') as HTMLElement)
        .dataset.chamfer,
    }
  })
}

/** Widest this name can ever lay out: chars x worst advance x compression. */
function worstCaseWidth(
  name: string,
  index: number,
  size: number,
  scale: number,
) {
  return `${name}\u00b7${index}`.length * WIDEST_BOLD_SANS_EM * scale * size
}

const UNITS: readonly [MagiUnit, MagiUnit, MagiUnit] = [
  { name: 'BALTHASAR', index: 2, state: 'pending' },
  { name: 'CASPER', index: 3, state: 'approved' },
  { name: 'MELCHIOR', index: 1, state: 'denied' },
]

describe('MagiTriad', () => {
  it('renders three named slabs and the hub as real DOM text', () => {
    render(<MagiTriad units={UNITS} />)

    const panels = screen.getAllByTestId('magi-panel')
    expect(panels).toHaveLength(3)
    expect(panels[0]).toHaveTextContent('BALTHASAR·2')
    expect(panels[1]).toHaveTextContent('CASPER·3')
    expect(panels[2]).toHaveTextContent('MELCHIOR·1')

    // Task 9: built from MagiPanels positioned with CSS, not raw SVG, so the
    // names stay selectable. No <svg> may appear in the plate.
    const triad = screen.getByTestId('magi-triad')
    expect(triad.querySelector('svg')).toBeNull()
    expect(screen.getByTestId('magi-triad-hub')).toHaveTextContent('MAGI')
  })

  it('maps each unit state onto a panel variant', () => {
    render(<MagiTriad units={UNITS} />)

    const [balthasar, casper, melchior] = screen.getAllByTestId('magi-panel')
    expect(balthasar).toHaveAttribute('data-variant', 'outline')
    expect(casper).toHaveAttribute('data-variant', 'filled')
    expect(melchior).toHaveAttribute('data-variant', 'denied')

    const slabs = screen.getAllByTestId('magi-triad-slab')
    expect(slabs.map((s) => s.dataset.state)).toEqual([
      'pending',
      'approved',
      'denied',
    ])
  })

  it('announces each state, since colour alone does not carry it', () => {
    render(<MagiTriad units={UNITS} />)

    expect(screen.getByText('DELIBERATING')).toHaveClass('sr-only')
    expect(screen.getByText('APPROVED')).toHaveClass('sr-only')
    expect(screen.getByText('DENIED')).toHaveClass('sr-only')
    expect(screen.getByRole('group', { name: 'MAGI deliberation' })).toBe(
      screen.getByTestId('magi-triad'),
    )
  })

  it('chamfers the hub-facing corners so the three cuts outline the hexagon', () => {
    render(<MagiTriad units={UNITS} />)

    const [balthasar, casper, melchior] = screen.getAllByTestId('magi-panel')
    expect(balthasar).toHaveAttribute(
      'data-chamfer',
      'bottom-left bottom-right',
    )
    expect(casper).toHaveAttribute('data-chamfer', 'top-right')
    expect(melchior).toHaveAttribute('data-chamfer', 'top-left')
  })

  it('bridges all three channels with decorative connector bars', () => {
    render(<MagiTriad units={UNITS} />)

    const bars = screen.getAllByTestId('magi-triad-connector')
    expect(bars).toHaveLength(3)
    for (const bar of bars) expect(bar).toHaveAttribute('aria-hidden', 'true')
    // Trunk bar runs flat; the two arm bars cross their 45° channels square on.
    expect(bars.map((b) => b.style.transform)).toEqual([
      '',
      'rotate(-45deg)',
      'rotate(45deg)',
    ])
  })

  it('sizes the plate in container units so the 45° cuts survive resizing', () => {
    render(<MagiTriad units={UNITS} />)

    const triad = screen.getByTestId('magi-triad')
    expect(triad.style.containerType).toBe('inline-size')
    expect(triad.style.aspectRatio).toMatch(/^720 \/ /)

    const plate = triad.firstElementChild as HTMLElement
    // A chamfer is a LENGTH, never a percentage: equal px on both axes.
    const slab = screen.getAllByTestId('magi-triad-slab')[0]
    expect(slab.style.getPropertyValue('--magi-chamfer')).toContain('cqw')
    expect(plate.style.getPropertyValue('--magi-panel-border')).toContain('cqw')
  })

  it('tilts the plate and scales it back so it never paints outside its box', () => {
    const { rerender } = render(<MagiTriad units={UNITS} />)
    const plate = () =>
      screen.getByTestId('magi-triad').firstElementChild as HTMLElement

    expect(plate().style.transform).toMatch(/^rotate\(3deg\) scale\(0\.9/)

    rerender(<MagiTriad units={UNITS} rotate={0} />)
    expect(plate().style.transform).toBe('rotate(0deg) scale(1.0000)')
  })

  it('gates the state-flip transition on motion, and defaults every unit', () => {
    render(<MagiTriad />)

    // `useFx()` works outside a provider; jsdom reports no reduced-motion
    // preference, so motion is on.
    expect(screen.getByTestId('magi-triad')).toHaveAttribute(
      'data-motion',
      'on',
    )
    for (const panel of screen.getAllByTestId('magi-panel')) {
      expect(panel).toHaveClass('transition-colors')
      expect(panel).toHaveAttribute('data-variant', 'outline')
    }
    expect(screen.getAllByTestId('magi-panel')[0]).toHaveTextContent(
      'BALTHASAR·2',
    )
  })

  // The reported failure: at ~660px wide with Google Fonts blocked, CASPER·3
  // ran into the MAGI hub and MELCHIOR·1 was clipped to "MELCHIOR·". The title
  // size is now derived from the slab geometry and the real name lengths, so
  // it fits whatever font resolves.
  it('keeps every name inside its slab flat width for any plausible font', () => {
    render(<MagiTriad units={UNITS} />)
    const slabs = readSlabs(screen.getByTestId('magi-triad'))

    slabs.forEach((slab, i) => {
      const { name, index } = UNITS[i]
      const width = worstCaseWidth(name, index, slab.title, slab.scale)
      expect(width).toBeLessThanOrEqual(slab.flat)
    })
  })

  it('keeps every name clear of its slab 45 degree cut', () => {
    render(<MagiTriad units={UNITS} />)
    const slabs = readSlabs(screen.getByTestId('magi-triad'))

    for (const slab of slabs) {
      if (slab.chamfer?.startsWith('bottom')) {
        // Top slab: the name sits above both bottom cuts…
        expect(slab.textBottom).toBeLessThanOrEqual(
          slab.innerHeight - slab.innerCut,
        )
      } else {
        // …the two side slabs sit below their single top cut.
        expect(slab.textTop).toBeGreaterThanOrEqual(slab.innerCut)
      }
    }
  })

  it('shrinks the shared title when a name is longer', () => {
    const long: readonly [MagiUnit, MagiUnit, MagiUnit] = [
      UNITS[0],
      UNITS[1],
      { name: 'MELCHIOR-PRIME', index: 1, state: 'approved' },
    ]
    const { rerender } = render(<MagiTriad units={UNITS} />)
    const before = readPlate(screen.getByTestId('magi-triad')).title

    rerender(<MagiTriad units={long} />)
    const triad = screen.getByTestId('magi-triad')
    const after = readPlate(triad).title
    expect(after).toBeLessThan(before)

    // …and the longer name still fits.
    const slab = readSlabs(triad)[2]
    expect(
      worstCaseWidth('MELCHIOR-PRIME', 1, slab.title, slab.scale),
    ).toBeLessThanOrEqual(slab.flat)
  })

  it('keeps the hub label inside the hub for any plausible font', () => {
    render(<MagiTriad units={UNITS} />)
    const triad = screen.getByTestId('magi-triad')
    const { px, scale } = readPlate(triad)
    const hub = screen.getByTestId('magi-triad-hub')

    const width =
      'MAGI'.length * WIDEST_BOLD_SANS_EM * scale * px(hub.style.fontSize)
    expect(width).toBeLessThanOrEqual(px(hub.style.width))
    expect(hub.style.transform).toBe(`scaleX(${scale})`)
  })
})
