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
})
