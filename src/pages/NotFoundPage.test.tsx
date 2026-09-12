import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders a denied MAGI read with the 404 code and a link home (R1 — no kanji)', () => {
    render(<NotFoundPage />)

    const panel = screen.getByTestId('magi-panel')
    expect(panel).toHaveAttribute('data-variant', 'denied')
    expect(panel).toHaveTextContent('PATTERN: UNKNOWN')
    expect(panel).toHaveTextContent('CODE: 404')

    const stamp = screen.getByTestId('magi-panel-stamp')
    expect(stamp).toHaveTextContent('DENIED')
    expect(stamp).not.toHaveAttribute('lang')

    const home = screen.getByRole('link', { name: /home/i })
    expect(home).toHaveAttribute('href', '/')
  })
})
