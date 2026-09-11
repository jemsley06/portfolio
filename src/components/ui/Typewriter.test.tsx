import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Typewriter } from './Typewriter'

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

function visible(): string {
  return screen.getByTestId('typewriter-visible').textContent ?? ''
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Typewriter', () => {
  it('reveals the text one character at a time when motion is on', () => {
    vi.useFakeTimers()
    render(<Typewriter text="MAGI" cps={10} />)

    expect(visible()).toBe('▌')

    act(() => void vi.advanceTimersByTime(100))
    expect(visible()).toBe('M▌')

    act(() => void vi.advanceTimersByTime(200))
    expect(visible()).toBe('MAG▌')
  })

  it('calls onDone once, after the last character', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Typewriter text="MAGI" cps={10} onDone={onDone} />)

    act(() => void vi.advanceTimersByTime(300))
    expect(onDone).not.toHaveBeenCalled()

    act(() => void vi.advanceTimersByTime(100))
    expect(visible()).toBe('MAGI')
    expect(onDone).toHaveBeenCalledTimes(1)

    act(() => void vi.advanceTimersByTime(1000))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('drops the caret once the line is complete', () => {
    vi.useFakeTimers()
    render(<Typewriter text="OK" cps={10} />)

    act(() => void vi.advanceTimersByTime(200))
    expect(screen.queryByTestId('typewriter-caret')).toBeNull()
  })

  it('renders instantly and reports done when motion is off', () => {
    stubReducedMotion(true)
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Typewriter text="PILOT TERMINAL ONLINE" cps={2} onDone={onDone} />)

    expect(visible()).toBe('PILOT TERMINAL ONLINE')
    expect(screen.queryByTestId('typewriter-caret')).toBeNull()
    expect(onDone).toHaveBeenCalledTimes(1)

    act(() => void vi.advanceTimersByTime(5000))
    expect(visible()).toBe('PILOT TERMINAL ONLINE')
  })

  it('exposes the finished line to assistive tech while it types', () => {
    vi.useFakeTimers()
    render(<Typewriter text="SYNC RATIO" cps={10} />)

    expect(screen.getByTestId('typewriter')).toHaveTextContent('SYNC RATIO')
    expect(screen.getByTestId('typewriter-visible')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
