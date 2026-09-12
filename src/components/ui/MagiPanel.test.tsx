import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MagiPanel } from './MagiPanel'

describe('MagiPanel', () => {
  it('renders the title with its MAGI index', () => {
    render(<MagiPanel variant="outline" title="MELCHIOR" index={1} />)

    const panel = screen.getByTestId('magi-panel')
    expect(panel).toHaveTextContent('MELCHIOR·1')
    expect(panel).toHaveAttribute('data-index', '1')
  })

  it('marks each variant so the rim and interior can be styled', () => {
    const { rerender } = render(<MagiPanel variant="outline" title="CASPER" />)
    expect(screen.getByTestId('magi-panel')).toHaveClass('bg-nerv')

    rerender(<MagiPanel variant="filled" title="CASPER" />)
    const filled = screen.getByTestId('magi-panel')
    expect(filled).toHaveAttribute('data-variant', 'filled')
    expect(screen.getByTestId('magi-panel-interior')).toHaveClass(
      'bg-magi',
      'text-ink',
    )

    rerender(<MagiPanel variant="denied" title="CASPER" />)
    const denied = screen.getByTestId('magi-panel')
    expect(denied).toHaveClass('bg-alert')
    expect(screen.getByTestId('magi-panel-interior')).toHaveClass('text-alert')
  })

  // R5 defect #1: `denied` used to wash its whole interior in red (`bg-alert-
  // deep/25`), which sank the stamp into the fill. The spec is an `alert`
  // border with a red stamp over the SAME dark interior `outline` uses.
  it('gives denied the same dark interior as outline, not a solid red fill', () => {
    const { rerender } = render(<MagiPanel variant="outline" title="X" />)
    const outlineInterior = screen.getByTestId('magi-panel-interior')
    expect(outlineInterior).toHaveClass('bg-ink-2')

    rerender(<MagiPanel variant="denied" title="X" />)
    const deniedPanel = screen.getByTestId('magi-panel')
    const deniedInterior = screen.getByTestId('magi-panel-interior')

    // The rim (outer layer) still carries the alert border colour…
    expect(deniedPanel).toHaveClass('bg-alert')
    // …but the interior matches outline's dark ink-2, not a red fill.
    expect(deniedInterior).toHaveClass('bg-ink-2')
    expect(deniedInterior).not.toHaveClass('bg-alert-deep/25')
    expect(deniedInterior).not.toHaveClass('bg-alert')
  })

  it('clips both layers with the same polygon so the rim survives', () => {
    render(<MagiPanel variant="outline" title="BALTHASAR" shape="pentagon" />)

    const panel = screen.getByTestId('magi-panel')
    const inner = panel.firstElementChild as HTMLElement
    expect(panel).toHaveAttribute('data-shape', 'pentagon')
    expect(panel.style.clipPath).toContain('polygon')
    expect(inner.style.clipPath).toBe(panel.style.clipPath)
    expect(panel.style.padding).toBe('var(--magi-panel-border, 5px)')
  })

  it('tilts only when asked', () => {
    const { rerender } = render(<MagiPanel variant="outline" title="X" />)
    expect(screen.getByTestId('magi-panel').style.transform).toBe('')

    rerender(<MagiPanel variant="filled" title="X" rotate={-14} />)
    expect(screen.getByTestId('magi-panel').style.transform).toBe(
      'rotate(-14deg)',
    )
  })

  it('renders the stamp as plain English text (R1 — no kanji glyphs)', () => {
    render(<MagiPanel variant="denied" title="CASPER" stamp="DENIED" />)

    const stamp = screen.getByTestId('magi-panel-stamp')
    expect(stamp).toHaveTextContent('DENIED')
    expect(stamp).toHaveAttribute('data-stamp', 'DENIED')
    expect(stamp).not.toHaveAttribute('lang')
    expect(stamp.querySelector('.sr-only')).toBeNull()
  })

  it('accepts all three English stamp values', () => {
    const { rerender } = render(
      <MagiPanel variant="filled" title="X" stamp="APPROVED" />,
    )
    expect(screen.getByTestId('magi-panel-stamp')).toHaveTextContent('APPROVED')

    rerender(<MagiPanel variant="outline" title="X" stamp="PENDING" />)
    expect(screen.getByTestId('magi-panel-stamp')).toHaveTextContent('PENDING')
  })

  it('renders children inside the clipped interior', () => {
    render(
      <MagiPanel variant="outline" title="CASPER">
        <span>PATTERN BLUE</span>
      </MagiPanel>,
    )

    expect(screen.getByText('PATTERN BLUE')).toBeInTheDocument()
  })

  // R2 — the 45 degree corner cut MagiTriad composes its three slabs from.
  it('cuts the named corners at 45 degrees, keeping the rim even', () => {
    const { rerender } = render(
      <MagiPanel variant="filled" title="CASPER" chamfer="top-right" />,
    )

    const panel = screen.getByTestId('magi-panel')
    const inner = screen.getByTestId('magi-panel-interior')
    expect(panel).toHaveAttribute('data-chamfer', 'top-right')
    // The cut is a LENGTH, not a percentage: equal px on both axes is what
    // keeps it at 45 degrees whatever the panel's aspect ratio.
    expect(panel.style.clipPath).toContain('var(--magi-chamfer, 1.75rem)')
    expect(panel.style.clipPath).toContain(
      'calc(100% - var(--magi-chamfer, 1.75rem)) 0%',
    )
    // The interior's cut is shrunk by b(2 - sqrt2) so the rim is the same
    // thickness on the diagonal as on the straight edges.
    expect(inner.style.clipPath).toContain('0.5857864')
    expect(inner.style.clipPath).not.toBe(panel.style.clipPath)

    rerender(
      <MagiPanel
        variant="filled"
        title="BALTHASAR"
        chamfer={['bottom-left', 'bottom-right']}
      />,
    )
    expect(screen.getByTestId('magi-panel')).toHaveAttribute(
      'data-chamfer',
      'bottom-left bottom-right',
    )
  })

  it('leaves the legacy shapes alone unless a chamfer is asked for', () => {
    const { rerender } = render(
      <MagiPanel variant="outline" title="X" shape="trapezoid" />,
    )
    const panel = () => screen.getByTestId('magi-panel')
    expect(panel()).not.toHaveAttribute('data-chamfer')
    expect(panel().style.clipPath).toBe(
      'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)',
    )

    // A chamfer overrides `shape`; `data-shape` still reports what was passed.
    rerender(
      <MagiPanel
        variant="outline"
        title="X"
        shape="trapezoid"
        chamfer="bottom-left"
      />,
    )
    expect(panel()).toHaveAttribute('data-shape', 'trapezoid')
    expect(panel().style.clipPath).toContain('var(--magi-chamfer')
  })

  it('drives the title size from --magi-panel-title so slabs can scale it', () => {
    render(<MagiPanel variant="filled" title="MELCHIOR" index={1} />)

    const title = screen.getByText(/MELCHIOR/)
    expect(title.style.fontSize).toBe('var(--magi-panel-title, 1.5rem)')
  })

  // A panel sized in container units must be able to scale its padding and
  // compress its title too; a hard-coded `p-4` eats a different share of the
  // slab at every width, and a title tuned for one font overflows in another.
  it('themes padding and title compression, defaulting to the old look', () => {
    render(<MagiPanel variant="filled" title="CASPER" index={3} />)

    const interior = screen.getByTestId('magi-panel-interior')
    // `1rem` is exactly the `p-4` this replaced, so existing panels are unchanged.
    expect(interior.style.padding).toBe('var(--magi-panel-pad, 1rem)')
    expect(interior).not.toHaveClass('p-4')

    const title = screen.getByText(/CASPER/)
    expect(title.style.transform).toBe(
      'scaleX(var(--magi-panel-title-scale, 1))',
    )
    expect(title.style.transformOrigin).toBe('center')
  })
})
