import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SevenSegment } from './SevenSegment'

function litSegments(cellIndex: number): string[] {
  const cell = screen
    .getByTestId('seven-segment')
    .querySelector(`[data-index="${cellIndex}"]`)
  return [...(cell?.querySelectorAll('[data-lit="true"] polygon') ?? [])].map(
    (polygon) => polygon.getAttribute('data-segment') ?? '',
  )
}

describe('SevenSegment', () => {
  it('exposes the literal value to assistive tech and hides the cells', () => {
    render(<SevenSegment value="4:59" />)

    const display = screen.getByTestId('seven-segment')
    expect(display).toHaveAttribute('data-value', '4:59')
    expect(display).toHaveTextContent('4:59')
    for (const cell of display.querySelectorAll('[data-cell]')) {
      expect(cell).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('lights the right segments for each digit', () => {
    render(<SevenSegment value="1807" />)

    /* '1' → b c · '8' → every segment · '0' → all but the middle · '7' → a b c */
    expect(litSegments(0).sort()).toEqual(['b', 'c'])
    expect(litSegments(1).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    expect(litSegments(2).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(litSegments(3).sort()).toEqual(['a', 'b', 'c'])
  })

  it('keeps the dormant segments on screen as ghosts', () => {
    render(<SevenSegment value="1" />)

    const ghosts = screen
      .getByTestId('seven-segment')
      .querySelectorAll('[data-lit="false"] polygon')
    expect(ghosts).toHaveLength(5)
    const ghostGroup = screen
      .getByTestId('seven-segment')
      .querySelector('[data-lit="false"]')
    expect(ghostGroup?.getAttribute('fill')).toContain('color-mix')
  })

  it('blooms only the lit segments', () => {
    const { container } = render(<SevenSegment value="8" />)

    expect(container.querySelector('[data-lit="true"]')).toHaveClass(
      'crt-bloom',
    )
    expect(container.querySelector('[data-lit="false"]')).not.toHaveClass(
      'crt-bloom',
    )
  })

  it('renders the colon as two lit dots', () => {
    render(<SevenSegment value=":" />)

    const colon = screen
      .getByTestId('seven-segment')
      .querySelector('[data-cell="colon"]')
    expect(colon?.querySelectorAll('rect')).toHaveLength(2)
  })

  it('scales every cell from `size` at the reference 1:1.9 aspect', () => {
    render(<SevenSegment value="7" size={190} />)

    const digit = screen
      .getByTestId('seven-segment')
      .querySelector('[data-cell="digit"]')
    expect(digit).toHaveAttribute('height', '190')
    expect(digit).toHaveAttribute('width', '100')
    /* The gap scales with the cell, not with the inherited font-size. */
    expect(screen.getByTestId('seven-segment').style.gap).toBe('15.2px')
  })

  it('switches the lit fill to alert on request', () => {
    render(<SevenSegment value="0" tone="alert" />)

    const lit = screen
      .getByTestId('seven-segment')
      .querySelector('[data-lit="true"]')
    expect(lit?.getAttribute('fill')).toBe('var(--color-alert)')
  })

  it('renders an unsupported character as an all-dark cell, keeping width', () => {
    render(<SevenSegment value="1X 2" />)

    const cells = screen
      .getByTestId('seven-segment')
      .querySelectorAll('[data-cell]')
    expect(cells).toHaveLength(4)

    const unknown = screen
      .getByTestId('seven-segment')
      .querySelector('[data-char="X"]')
    expect(unknown).toHaveAttribute('data-known', 'false')
    expect(unknown?.querySelectorAll('[data-lit="true"] polygon')).toHaveLength(
      0,
    )
    expect(
      unknown?.querySelectorAll('[data-lit="false"] polygon'),
    ).toHaveLength(7)
    expect(
      screen.getByTestId('seven-segment').querySelector('[data-cell="space"]'),
    ).not.toBeNull()
  })
})
