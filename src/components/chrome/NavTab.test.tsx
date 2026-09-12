import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { NavTab } from './NavTab'
import type { Route } from '../../routes'

const HOME: Route = {
  path: '/',
  label: 'HOME',
  kanji: '本部',
  element: <div />,
}

const PILOT: Route = {
  path: '/pilot',
  label: 'PILOT',
  kanji: '操縦者',
  element: <div />,
}

function renderAt(route: Route, initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavTab route={route} />
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

  it('renders the route kanji and label', () => {
    renderAt(PILOT, '/pilot')

    expect(screen.getByText('操縦者')).toBeInTheDocument()
    expect(screen.getByText('PILOT')).toBeInTheDocument()
  })
})
