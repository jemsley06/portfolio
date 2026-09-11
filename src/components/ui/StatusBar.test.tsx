import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('renders its content between two decorative brackets', () => {
    render(<StatusBar>ACCESS MODE: VISITOR</StatusBar>)

    const bar = screen.getByTestId('status-bar')
    expect(bar).toHaveTextContent('ACCESS MODE: VISITOR')

    const brackets = bar.querySelectorAll('[data-bracket]')
    expect(brackets).toHaveLength(2)
    for (const bracket of brackets) {
      expect(bracket).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('defaults to the nerv tone and accepts alert', () => {
    const { rerender } = render(<StatusBar>OK</StatusBar>)
    expect(screen.getByTestId('status-bar')).toHaveClass('border-nerv')

    rerender(<StatusBar tone="alert">PATTERN BLUE</StatusBar>)
    const bar = screen.getByTestId('status-bar')
    expect(bar).toHaveAttribute('data-tone', 'alert')
    expect(bar).toHaveClass('border-alert', 'text-alert')
  })
})
