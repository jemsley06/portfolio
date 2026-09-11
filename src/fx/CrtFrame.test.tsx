import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CrtFrame } from './CrtFrame'
import { FxProvider } from './FxProvider'
import { FX_STORAGE_KEY } from './useFx'

function renderFrame() {
  return render(
    <FxProvider>
      <CrtFrame>
        <h1>PILOT</h1>
      </CrtFrame>
    </FxProvider>,
  )
}

function layerNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-crt-layer]')].map(
    (layer) => layer.getAttribute('data-crt-layer') ?? '',
  )
}

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
  window.localStorage.clear()
})

describe('CrtFrame', () => {
  it('renders its children as real DOM', () => {
    renderFrame()

    expect(screen.getByRole('heading', { name: 'PILOT' })).toBeInTheDocument()
  })

  it('mounts the phosphor filter bank with the documented ids', () => {
    const { container } = renderFrame()

    for (const id of ['phosphor-bloom', 'chroma-shift', 'crt-grain']) {
      expect(container.querySelector(`filter#${id}`), id).not.toBeNull()
    }
  })

  it('renders the full overlay stack, hidden from assistive tech', () => {
    const { container } = renderFrame()

    expect(layerNames(container)).toEqual([
      'scanlines',
      'aperture',
      'grain',
      'rollbar',
      'flicker',
      'vignette',
    ])

    for (const layer of container.querySelectorAll('[data-crt-layer]')) {
      expect(layer.getAttribute('aria-hidden')).toBe('true')
      expect(getComputedStyle(layer).animationName).toBe('none')
    }
  })

  it('renders no overlays at all when FX are off, but keeps the content', () => {
    window.localStorage.setItem(FX_STORAGE_KEY, 'off')

    const { container } = renderFrame()

    expect(document.documentElement.dataset.fx).toBe('off')
    expect(layerNames(container)).toEqual([])
    expect(screen.getByRole('heading', { name: 'PILOT' })).toBeInTheDocument()
  })

  it('drops the moving layers under prefers-reduced-motion', () => {
    stubReducedMotion(true)

    const { container } = renderFrame()

    expect(layerNames(container)).toEqual([
      'scanlines',
      'aperture',
      'grain',
      'vignette',
    ])
  })
})
