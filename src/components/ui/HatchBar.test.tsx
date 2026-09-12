import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HatchBar } from './HatchBar'

describe('HatchBar', () => {
  it('hatches in mint by default and is hidden from assistive tech', () => {
    render(<HatchBar />)

    const bar = screen.getByTestId('hatch-bar')
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    expect(bar).toHaveAttribute('data-tone', 'magi')
    expect(bar.style.backgroundImage).toContain('var(--color-magi)')
    expect(bar.style.backgroundImage).toContain('120deg')
    /* Line and pitch are tunable so a stretched bar keeps the 1:2 ratio. */
    expect(bar.style.backgroundImage).toContain('var(--hatch-line, 5px)')
  })

  it('switches to orange on request', () => {
    render(<HatchBar tone="nerv" />)

    expect(screen.getByTestId('hatch-bar').style.backgroundImage).toContain(
      'var(--color-nerv)',
    )
  })

  it('lets a caller override the height class', () => {
    render(<HatchBar className="h-8" />)

    expect(screen.getByTestId('hatch-bar')).toHaveClass('h-8')
  })
})
