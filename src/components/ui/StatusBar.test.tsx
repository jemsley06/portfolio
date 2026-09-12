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

  // R5 defect #3: long text that wrapped to a second line used to overflow
  // past the bracket frame, because the flex label item's default
  // `min-width: auto` refused to let it shrink and wrap. `min-w-0` is the
  // fix; the brackets are pinned `self-stretch` so they always span whatever
  // height the (possibly two-line) label grows the bar to.
  it('lets its label shrink and wrap instead of escaping the frame', () => {
    render(
      <StatusBar>
        A VERY LONG STATUS LINE THAT MUST WRAP INSIDE THE BRACKETED FRAME
      </StatusBar>,
    )

    const label = screen.getByTestId('status-bar-label')
    expect(label).toHaveClass('min-w-0', 'flex-1')
    expect(label).not.toHaveClass('whitespace-nowrap')

    const brackets = screen
      .getByTestId('status-bar')
      .querySelectorAll('[data-bracket]')
    for (const bracket of brackets) {
      expect(bracket).toHaveClass('self-stretch')
    }
  })
})
