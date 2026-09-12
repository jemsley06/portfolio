/* ---------------------------------------------------------------------------
 * FxProvider — owns the manual CRT switch.
 *
 * Mounts once, above everything (see `App.tsx`). It restores the persisted
 * choice, stamps `<html data-fx="on|off">` so `crt.css` can flatten the whole
 * terminal without a re-render, and hands `{ motionOn, fxOn, toggleFx }` down
 * through context. Reduced motion is read from the media query, never stored.
 * ------------------------------------------------------------------------- */
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  FxContext,
  readStoredFx,
  usePrefersReducedMotion,
  writeStoredFx,
  type FxState,
} from './useFx'

export function FxProvider({ children }: { children: ReactNode }) {
  const [fxOn, setFxOn] = useState(readStoredFx)
  const prefersReducedMotion = usePrefersReducedMotion()

  /* Layout effect, not effect: the attribute must be in place before the first
     paint, or a visitor who turned FX off sees one frame of scanlines. */
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.fx = fxOn ? 'on' : 'off'
    writeStoredFx(fxOn)
    return () => {
      delete root.dataset.fx
    }
  }, [fxOn])

  const toggleFx = useCallback(() => {
    setFxOn((previous) => !previous)
  }, [])

  const value = useMemo<FxState>(
    () => ({ fxOn, motionOn: fxOn && !prefersReducedMotion, toggleFx }),
    [fxOn, prefersReducedMotion, toggleFx],
  )

  return <FxContext.Provider value={value}>{children}</FxContext.Provider>
}
