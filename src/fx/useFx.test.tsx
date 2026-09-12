import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FxProvider } from './FxProvider'
import { FX_STORAGE_KEY, useFx } from './useFx'

/** Minimal consumer: shows the FX state as text and exposes the toggle. */
function FxProbe() {
  const { fxOn, motionOn, toggleFx } = useFx()
  return (
    <>
      <p>{`FX ${fxOn ? 'ON' : 'OFF'}`}</p>
      <p>{`MOTION ${motionOn ? 'ON' : 'OFF'}`}</p>
      <button type="button" onClick={toggleFx}>
        TOGGLE FX
      </button>
    </>
  )
}

function renderProbe() {
  return render(
    <FxProvider>
      <FxProbe />
    </FxProvider>,
  )
}

/** Replaces the jsdom stub so `(prefers-reduced-motion: reduce)` matches. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('FxProvider / useFx', () => {
  it('defaults to FX on and stamps data-fx on <html>', () => {
    renderProbe()

    expect(screen.getByText('FX ON')).toBeInTheDocument()
    expect(screen.getByText('MOTION ON')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBe('on')
  })

  it('toggling flips data-fx and persists the choice', async () => {
    const user = userEvent.setup()
    renderProbe()

    await user.click(screen.getByRole('button', { name: 'TOGGLE FX' }))

    expect(screen.getByText('FX OFF')).toBeInTheDocument()
    expect(screen.getByText('MOTION OFF')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBe('off')
    expect(window.localStorage.getItem(FX_STORAGE_KEY)).toBe('off')

    await user.click(screen.getByRole('button', { name: 'TOGGLE FX' }))

    expect(screen.getByText('FX ON')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBe('on')
    expect(window.localStorage.getItem(FX_STORAGE_KEY)).toBe('on')
  })

  it('restores a persisted "off" choice on the next mount', () => {
    window.localStorage.setItem(FX_STORAGE_KEY, 'off')

    renderProbe()

    expect(screen.getByText('FX OFF')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBe('off')
  })

  it('drops motion but keeps FX when prefers-reduced-motion matches', () => {
    stubReducedMotion(true)

    renderProbe()

    expect(screen.getByText('FX ON')).toBeInTheDocument()
    expect(screen.getByText('MOTION OFF')).toBeInTheDocument()
  })

  it('keeps working when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const user = userEvent.setup()

    renderProbe()
    expect(screen.getByText('FX ON')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'TOGGLE FX' }))

    expect(screen.getByText('FX OFF')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBe('off')
  })

  it('keeps working when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined)

    renderProbe()

    expect(screen.getByText('FX ON')).toBeInTheDocument()
    expect(screen.getByText('MOTION ON')).toBeInTheDocument()
  })

  it('falls back to FX on outside a provider, with an inert toggle', async () => {
    const user = userEvent.setup()
    render(<FxProbe />)

    expect(screen.getByText('FX ON')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'TOGGLE FX' }))

    expect(screen.getByText('FX ON')).toBeInTheDocument()
    expect(document.documentElement.dataset.fx).toBeUndefined()
  })
})
