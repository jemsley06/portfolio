/* `tests/setup.ts` loads `vitest-canvas-mock`, so every canvas call is a stub:
 * these tests assert on LIFECYCLE and CALL PATTERNS (context acquisition, the
 * rAF loop, the ResizeObserver, which heightfield was chosen), never pixels.
 * The drawing math itself is covered by `topoRender.test.ts`. */
import { act, render, screen, waitFor } from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { TopoMap } from './TopoMap'
import { TERRAIN_META, resetBakedTerrainCache } from '../../lib/terrain'

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = []
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ResizeObserverStub.instances.push(this)
  }
}

/** jsdom lays nothing out, so a canvas is 0x0 and the renderer would bail. */
function giveCanvasesSize(width: number, height: number): void {
  for (const prop of [
    ['clientWidth', width],
    ['clientHeight', height],
  ] as const) {
    Object.defineProperty(HTMLCanvasElement.prototype, prop[0], {
      configurable: true,
      get: () => prop[1],
    })
  }
}

function stubTerrainFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(TERRAIN_META.bytes),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeAll(() => {
  giveCanvasesSize(800, 500)
})

beforeEach(() => {
  ResizeObserverStub.instances = []
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  resetBakedTerrainCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TopoMap', () => {
  it('renders a decorative canvas that is hidden from assistive tech', async () => {
    stubTerrainFetch()
    render(<TopoMap />)

    const canvas = screen.getByTestId('topo-map')
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toHaveClass('pointer-events-none')
    await waitFor(() => expect(canvas).toHaveAttribute('data-field', 'baked'))
  })

  it('fetches the baked heightfield and draws on a 2d context', async () => {
    const fetchMock = stubTerrainFetch()
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')

    render(<TopoMap />)

    await waitFor(() =>
      expect(screen.getByTestId('topo-map')).toHaveAttribute(
        'data-field',
        'baked',
      ),
    )
    expect(fetchMock).toHaveBeenCalledWith(TERRAIN_META.assetUrl)
    expect(getContext).toHaveBeenCalledWith('2d')
  })

  it('waits for the asset before drawing rather than flashing fake ground', () => {
    stubTerrainFetch()
    render(<TopoMap />)

    expect(screen.getByTestId('topo-map')).toHaveAttribute(
      'data-field',
      'pending',
    )
  })

  it('falls back to procedural terrain when the asset cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<TopoMap />)

    await waitFor(() =>
      expect(screen.getByTestId('topo-map')).toHaveAttribute(
        'data-field',
        'procedural',
      ),
    )
  })

  it('draws invented ground with no network at all when asked for noise', () => {
    const fetchMock = stubTerrainFetch()
    render(<TopoMap source="noise" />)

    const canvas = screen.getByTestId('topo-map')
    expect(canvas).toHaveAttribute('data-source', 'noise')
    expect(canvas).toHaveAttribute('data-field', 'procedural')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('drifts through a rAF loop and cancels it on unmount', () => {
    const request = vi.spyOn(window, 'requestAnimationFrame')
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')

    const { unmount } = render(<TopoMap source="noise" />)
    expect(request).toHaveBeenCalled()

    act(() => unmount())
    expect(cancel).toHaveBeenCalled()
  })

  it('draws a single static frame when drift is switched off', () => {
    const request = vi.spyOn(window, 'requestAnimationFrame')

    render(<TopoMap source="noise" drift={false} />)

    expect(request).not.toHaveBeenCalled()
  })

  it('redraws on resize and stops observing on unmount', () => {
    const { unmount } = render(<TopoMap source="noise" />)

    const observer = ResizeObserverStub.instances.at(-1)
    expect(observer?.observe).toHaveBeenCalledWith(
      screen.getByTestId('topo-map'),
    )

    act(() => unmount())
    expect(observer?.disconnect).toHaveBeenCalled()
  })

  it('survives an environment with no ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    expect(() => render(<TopoMap source="noise" />)).not.toThrow()
  })

  it('takes a per-page opacity and extra classes', () => {
    render(<TopoMap source="noise" opacity={0.35} className="rounded-md" />)

    const canvas = screen.getByTestId('topo-map')
    expect(canvas).toHaveStyle({ opacity: '0.35' })
    expect(canvas).toHaveClass('rounded-md')
  })

  it('accepts a window over part of the field without re-seeding', () => {
    expect(() =>
      render(
        <TopoMap
          source="noise"
          view={{ x: 0.2, y: 0.3, width: 0.4, height: 0.35 }}
          lines={18}
          relief={1.4}
          features={false}
          registration={false}
        />,
      ),
    ).not.toThrow()
  })
})
