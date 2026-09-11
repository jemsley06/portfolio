import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BoxedLabel } from './BoxedLabel'

describe('BoxedLabel', () => {
  it('renders a plain span by default, in the nerv tone', () => {
    render(<BoxedLabel>TEST PLUG 01</BoxedLabel>)

    const label = screen.getByTestId('boxed-label')
    expect(label.tagName).toBe('SPAN')
    expect(label).toHaveAttribute('data-tone', 'nerv')
    expect(label).toHaveClass('border-nerv', 'text-nerv')
  })

  it('carries each tone as whole utility classes', () => {
    const { rerender } = render(<BoxedLabel tone="acid">MONITOR</BoxedLabel>)
    expect(screen.getByTestId('boxed-label')).toHaveClass('text-acid')

    rerender(<BoxedLabel tone="alert">MONITOR</BoxedLabel>)
    expect(screen.getByTestId('boxed-label')).toHaveClass('text-alert')

    rerender(<BoxedLabel tone="magi">MONITOR</BoxedLabel>)
    expect(screen.getByTestId('boxed-label')).toHaveClass('text-magi')
  })

  it('renders a keyboard-focusable link', async () => {
    const user = userEvent.setup()
    render(
      <BoxedLabel as="a" href="https://example.test" target="_blank">
        GITHUB
      </BoxedLabel>,
    )

    const link = screen.getByRole('link', { name: 'GITHUB' })
    expect(link).toHaveAttribute('href', 'https://example.test')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    await user.tab()
    expect(link).toHaveFocus()
  })

  it('renders a type="button" button that fires on Enter', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <BoxedLabel as="button" onClick={onClick}>
        ACTIVE
      </BoxedLabel>,
    )

    const button = screen.getByRole('button', { name: 'ACTIVE' })
    expect(button).toHaveAttribute('type', 'button')

    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('passes aria-current through for the active nav tab', () => {
    render(
      <BoxedLabel as="a" href="/pilot" aria-current="page">
        PILOT
      </BoxedLabel>,
    )

    expect(screen.getByRole('link', { name: 'PILOT' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
