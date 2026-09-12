/* ---------------------------------------------------------------------------
 * FX state — the CRT layer's only public contract.
 *
 *   const { motionOn, fxOn, toggleFx } = useFx()
 *
 *   fxOn      manual switch (persisted in localStorage['fx'], default "on")
 *   motionOn  fxOn && !prefers-reduced-motion — gate EVERY animation on this
 *   toggleFx  flips fxOn, persists it, and re-stamps <html data-fx>
 *
 * `fx/` knows nothing about pages: this module owns the media-query store and
 * the storage helpers, `FxProvider.tsx` owns the component that fills the
 * context (split so the provider file exports a component and nothing else,
 * which keeps `react-refresh/only-export-components` quiet).
 *
 * Outside a provider `useFx()` still works: FX reads as on and `motionOn`
 * tracks `prefers-reduced-motion` directly, so a primitive can be unit-tested
 * or dropped into a story without wiring the provider first.
 * ------------------------------------------------------------------------- */
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'

export type FxState = {
  /** `fxOn && !prefers-reduced-motion` — the gate for every animation. */
  motionOn: boolean
  /** The manual CRT switch. Mirrored to `<html data-fx="on|off">`. */
  fxOn: boolean
  /** Flip the manual switch and persist the choice. */
  toggleFx: () => void
}

/** `localStorage` key holding `"on"` / `"off"`. */
export const FX_STORAGE_KEY = 'fx'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** `null` means "no provider above me" — `useFx` then falls back. */
export const FxContext = createContext<FxState | null>(null)

function getMediaQueryList(): MediaQueryList | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null
  }
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY)
  } catch {
    return null
  }
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = getMediaQueryList()
  if (!query) return () => {}

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onStoreChange)
    return () => query.removeEventListener('change', onStoreChange)
  }
  /* Safari < 14 and older jsdom stubs only speak the deprecated API. */
  if (typeof query.addListener === 'function') {
    query.addListener(onStoreChange)
    return () => query.removeListener(onStoreChange)
  }
  return () => {}
}

function getReducedMotionSnapshot(): boolean {
  return getMediaQueryList()?.matches ?? false
}

function getReducedMotionServerSnapshot(): boolean {
  return false
}

/** Subscribes to `(prefers-reduced-motion: reduce)`; `false` when unsupported. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
}

/** Reads the persisted switch. Anything but `"off"` (including a throwing or
 *  absent `localStorage`) means FX are on. */
export function readStoredFx(): boolean {
  try {
    return window.localStorage.getItem(FX_STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Persists the switch. Private browsing / blocked storage must not throw. */
export function writeStoredFx(fxOn: boolean): void {
  try {
    window.localStorage.setItem(FX_STORAGE_KEY, fxOn ? 'on' : 'off')
  } catch {
    /* storage unavailable — the choice simply does not survive a reload */
  }
}

function noop(): void {}

export function useFx(): FxState {
  const provided = useContext(FxContext)
  const prefersReducedMotion = usePrefersReducedMotion()

  const fallback = useMemo<FxState>(
    () => ({ fxOn: true, motionOn: !prefersReducedMotion, toggleFx: noop }),
    [prefersReducedMotion],
  )

  return provided ?? fallback
}
