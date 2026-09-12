import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MagiTriad, type MagiUnit } from './MagiTriad'

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
})
