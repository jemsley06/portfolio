import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HazardStripe } from './HazardStripe'

describe('HazardStripe', () => {
  it('hides the stripes from assistive tech and uses tokens for colour', () => {
    render(<HazardStripe />)

    const bands = screen.getByTestId('hazard-stripe-bands')
    expect(bands).toHaveAttribute('aria-hidden', 'true')
    expect(bands.style.backgroundImage).toContain('var(--color-alert)')
    expect(bands.style.backgroundImage).toContain('135deg')
  })

  it('defaults to a 16px band and honours a custom height', () => {
    const { rerender } = render(<HazardStripe />)
    const band = screen.getByTestId('hazard-stripe')
    expect(band).toHaveAttribute('data-height', '16')
    expect(band.style.height).toBe('16px')
    expect(band.style.getPropertyValue('--hazard-pitch')).toBe('12px')

    rerender(<HazardStripe height={48} />)
    const tall = screen.getByTestId('hazard-stripe')
    expect(tall.style.height).toBe('48px')
    /* Pitch tracks the height so the texture stays proportional. */
    expect(tall.style.getPropertyValue('--hazard-pitch')).toBe('36px')
  })

  it('seats an optional English label as real, readable text (R1 — no kanji)', () => {
    render(<HazardStripe label="DANGER" />)

    const label = screen.getByText('DANGER')
    expect(label).not.toHaveAttribute('lang')
    expect(label).not.toHaveAttribute('aria-hidden')
  })

  // R5 defect #2: the label used to sit directly on the stripes with no
  // backing plate, so red text on the red half of the stripe was nearly
  // unreadable. The label now carries a solid `ink` plate, and the stripe
  // layer is pinned behind it via a negative z-index rather than depending
  // on DOM order.
  it('gives the label a solid ink plate that the stripes cannot paint over', () => {
    render(<HazardStripe label="DANGER" />)

    const label = screen.getByTestId('hazard-stripe-label')
    expect(label).toHaveAttribute('data-plate', 'ink')
    expect(label).toHaveClass('bg-ink')

    const bands = screen.getByTestId('hazard-stripe-bands')
    expect(bands).toHaveClass('-z-10')
  })
})
