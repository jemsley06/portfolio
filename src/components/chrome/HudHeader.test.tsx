import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HudHeader, MobileTabBar } from './HudHeader'
import { FxProvider } from '../../fx/FxProvider'
import { FX_STORAGE_KEY } from '../../fx/useFx'
import { ROUTES } from '../../routes'

function renderHeader(initialPath = '/pilot') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <FxProvider>
        <HudHeader />
      </FxProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
  vi.useRealTimers()
})

describe('HudHeader', () => {
  it('renders the callsign and unit line', () => {
    renderHeader()

    expect(screen.getAllByText('J. EMSLEY').length).toBeGreaterThan(0)
    expect(screen.getByText('UNIT-01 // PILOT TERMINAL')).toBeInTheDocument()
  })

  it('renders one nav tab per route, with the current route marked current', () => {
    renderHeader('/pilot')

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(ROUTES.length)

    const current = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    )
    expect(current).toHaveLength(1)
    expect(within(nav).getByText('PILOT')).toBeInTheDocument()
  })

  it('renders the live clock with the T+ telemetry prefix and ticks it', () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 1, 0, 0, 0, 0) })

    renderHeader()

    const clockValues = screen.getAllByText(/^T\+/)
    expect(clockValues.length).toBeGreaterThan(0)
    expect(clockValues[0]).toHaveTextContent('T+0:00:00000')
    expect(clockValues[0]).toHaveAttribute('aria-hidden', 'true')

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.getAllByText(/^T\+/)[0]).toHaveTextContent('T+0:00:00400')
  })

  it('clears both clock intervals (desktop + mobile-collapsed) on unmount', () => {
    // Spy on the real timer functions rather than asserting on
    // `vi.getTimerCount()`: with fake timers installed, React's own
    // scheduler also registers timers unrelated to this component, which
    // makes a raw count an unreliable signal here. Spying pins the
    // assertion to exactly the ids this component's effect creates.
    const setSpy = vi.spyOn(window, 'setInterval')
    const clearSpy = vi.spyOn(window, 'clearInterval')

    const { unmount } = renderHeader()
    const ids = setSpy.mock.results.map((result) => result.value)
    expect(ids.length).toBeGreaterThan(0)

    unmount()

    const clearedIds = clearSpy.mock.calls.map(([id]) => id)
    for (const id of ids) {
      expect(clearedIds).toContain(id)
    }
  })

  it('wires the FX toggle to useFx()', async () => {
    const user = userEvent.setup()
    renderHeader()

    const toggle = screen.getByRole('button', { name: /turn crt effects/i })
    expect(toggle).toHaveTextContent('FX ON')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)

    expect(toggle).toHaveTextContent('FX OFF')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.fx).toBe('off')
    expect(window.localStorage.getItem(FX_STORAGE_KEY)).toBe('off')
  })
})

describe('MobileTabBar', () => {
  it('renders one nav tab per route as a fixed bottom bar', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <MobileTabBar />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav).toHaveClass('fixed', 'bottom-0', 'grid-cols-4')

    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(ROUTES.length)
    expect(
      links.filter((link) => link.getAttribute('aria-current') === 'page'),
    ).toHaveLength(1)
  })

  // R5 defect #4: the four tabs used to sit at unequal heights because the
  // old kanji sub-label wrapped mid-word on some routes but not others.
  it('gives every tab chip the same minimum height so none can drift', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileTabBar />
      </MemoryRouter>,
    )

    const chips = screen.getAllByTestId('boxed-label')
    expect(chips).toHaveLength(ROUTES.length)
    for (const chip of chips) {
      expect(chip).toHaveClass('min-h-11')
    }
  })
})
