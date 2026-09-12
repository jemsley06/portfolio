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
})
