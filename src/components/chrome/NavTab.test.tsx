import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { NavTab } from './NavTab'
import type { Route } from '../../routes'

const HOME: Route = {
  path: '/',
  label: 'HOME',
  element: <div />,
}

const PILOT: Route = {
  path: '/pilot',
  label: 'PILOT',
  element: <div />,
}

function renderAt(route: Route, initialPath: string, index?: number) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavTab route={route} index={index} />
    </MemoryRouter>,
  )
}

describe('NavTab', () => {
  it('marks the tab matching the current route as the active page', () => {
    renderAt(PILOT, '/pilot')

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-current', 'page')

    const chip = screen.getByTestId('boxed-label')
    expect(chip).toHaveAttribute('data-tone', 'magi')
  })

  it('leaves a non-matching tab without aria-current, styled as a pending outline', () => {
    renderAt(PILOT, '/projects')

    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('aria-current')

    const chip = screen.getByTestId('boxed-label')
    expect(chip).toHaveAttribute('data-tone', 'nerv')
  })

  it('treats "/" as an exact match, not a prefix (`end`)', () => {
    renderAt(HOME, '/pilot')

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('renders only the English route label — no kanji', () => {
    renderAt(PILOT, '/pilot')

    expect(screen.getByText('PILOT')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAccessibleName('PILOT')
  })

  it('renders a decorative, aria-hidden channel eyebrow from `index`', () => {
    renderAt(PILOT, '/pilot', 3)

    const chip = screen.getByTestId('boxed-label')
    const eyebrow = within(chip).getByText('CH.03')
    expect(eyebrow).toHaveAttribute('aria-hidden', 'true')
    // The eyebrow is decorative only — it must not leak into the link's name.
    expect(screen.getByRole('link')).toHaveAccessibleName('PILOT')
  })

  it('omits the eyebrow entirely when no index is given', () => {
    renderAt(PILOT, '/pilot')

    expect(screen.queryByText(/^CH\./)).not.toBeInTheDocument()
  })

  // R5 defect #4: mobile labels used to wrap mid-word (from the old kanji
  // sub-label) and leave the four tabs at unequal heights. Every chip now
  // pins an equal minimum height and forbids the label from wrapping.
  it('pins an equal minimum height and keeps the label on one line', () => {
    renderAt(PILOT, '/pilot', 2)

    const chip = screen.getByTestId('boxed-label')
    expect(chip).toHaveClass('min-h-11')
    expect(within(chip).getByText('PILOT')).toHaveClass('whitespace-nowrap')
  })
})
