/* ---------------------------------------------------------------------------
 * ScanlineOverlay — the fixed, decorative CRT layers.
 *
 * Every layer is `position: fixed; inset: 0; pointer-events: none` (see
 * `styles/crt.css`), so the stack costs zero layout and never eats a click.
 * Layers are also `aria-hidden`: assistive tech sees a plain terminal.
 *
 * The whole stack disappears when FX are off; the two layers that exist only
 * to move (roll bar, flicker) additionally require `motionOn`, so
 * `prefers-reduced-motion` removes them rather than merely freezing them.
 *
 * `data-crt-layer` is the stable hook for tests — class names stay free to
 * change with the styling.
 * ------------------------------------------------------------------------- */
import { useFx } from './useFx'

export function ScanlineOverlay() {
  const { fxOn, motionOn } = useFx()

  if (!fxOn) return null

  return (
    <>
      <div className="crt-scanlines" data-crt-layer="scanlines" aria-hidden />
      <div className="crt-aperture" data-crt-layer="aperture" aria-hidden />
      <div className="crt-grain" data-crt-layer="grain" aria-hidden>
        <svg
          className="crt-grain-field"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="none"
        >
          <rect width="100%" height="100%" filter="url(#crt-grain)" />
        </svg>
      </div>
      {motionOn && (
        <>
          <div className="crt-rollbar" data-crt-layer="rollbar" aria-hidden />
          <div className="crt-flicker" data-crt-layer="flicker" aria-hidden />
        </>
      )}
      <div className="crt-vignette" data-crt-layer="vignette" aria-hidden />
    </>
  )
}
