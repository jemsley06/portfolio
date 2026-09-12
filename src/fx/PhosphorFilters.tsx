/* ---------------------------------------------------------------------------
 * PhosphorFilters — the SVG filter bank the CRT layer references by id.
 *
 *   #phosphor-bloom  1px stroke + blown-out core + halo (`.crt-bloom`)
 *   #chroma-shift    ±0.7px red/blue convergence error (`.crt-chroma`)
 *   #crt-grain       fractal-noise film grain (the `.crt-grain` overlay)
 *
 * Rendered as a 0x0 absolutely positioned <svg> so it costs no layout. It must
 * stay in the tree (never `display:none`) or the `url(#id)` references break.
 * ------------------------------------------------------------------------- */
export function PhosphorFilters() {
  return (
    <svg className="crt-filters" aria-hidden="true" focusable="false">
      <defs>
        {/* The canonical MAGI-report bloom: crisp stroke wrapped in a halo. */}
        <filter
          id="phosphor-bloom"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1.4 0 0 0 0  0 1.4 0 0 0  0 0 1.4 0 0  0 0 0 0.9 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Convergence error: red drifts left, blue right, screened back on. */}
        <filter id="chroma-shift">
          <feOffset in="SourceGraphic" dx="-0.7" result="r" />
          <feColorMatrix
            in="r"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="rC"
          />
          <feOffset in="SourceGraphic" dx="0.7" result="b" />
          <feColorMatrix
            in="b"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="bC"
          />
          <feBlend in="rC" in2="bC" mode="screen" result="rb" />
          <feBlend in="rb" in2="SourceGraphic" mode="screen" />
        </filter>

        {/* Grain field — feTurbulence generates, so SourceGraphic is unused. */}
        <filter id="crt-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  )
}
