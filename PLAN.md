# EVA-UI Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task names the model tier that should execute it (**Opus** for architecture / visual-effects work, **Sonnet** for content pages, tests, and polish). Every task ends with a verified, committed, independently reviewable deliverable.

**Goal:** A four-tab personal portfolio (Home, Pilot, Projects, Resume) that looks like a NERV / MAGI terminal from *Neon Genesis Evangelion* rendered on an aging CRT: orange / green / red phosphor UI, dense schematic layouts, scanlines, bloom, blur, and a pilot-sync loading screen.

**Architecture:** Vite + React 19 single-page app with React Router. A global `CrtFrame` wraps every route and layers the CRT post-processing (scanlines, vignette, noise, flicker, bloom) purely with CSS and inline SVG filters. Page content is DOM text so it stays selectable and accessible; decorative graphics (sync ribbon, topographic map, wireframe globe) are `<canvas>` / SVG components. All copy lives in typed content files under `src/content/` so the owner edits data, never JSX.

**Tech Stack:** Vite 6, React 19, TypeScript (strict), React Router 7 (declarative `<BrowserRouter>`), Tailwind CSS v4 (`@theme` tokens), Motion (`motion/react`), Vitest + React Testing Library + jsdom, ESLint (typescript-eslint) + Prettier, Google Fonts (Barlow Condensed, Share Tech Mono, Noto Sans JP), deployed as static files to Vercel.

**Spec:** This document is the spec. Visual ground truth is `references/` (9 files, catalogued in §Reference Catalogue).

**Context:** The project directory contains only `references/`. An earlier May-2026 Next.js prototype no longer exists on disk; nothing is reused. Decisions confirmed with the owner on 2026-09-11: Vite + React SPA; CSS + SVG CRT layer (no WebGL); Resume as structured data rendered in-theme plus a PDF download; direct show names (NERV, MAGI, MELCHIOR / BALTHASAR / CASPER) are acceptable.

---

## Global Constraints

- **Node ≥ 20**, package manager **pnpm** (lockfile committed).
- **TypeScript `strict: true`**, no `any`, no `// @ts-ignore`.
- **Static deployment**: no server, no API routes, no env secrets. Contact = links only (`mailto:jtey20@gmail.com`, GitHub, LinkedIn).
- **Fonts** only from Google Fonts: `Barlow Condensed` (700/800, display), `Share Tech Mono` (telemetry / body-mono), `Noto Sans JP` (700, kanji accents). Every `font-family` has a system fallback.
- **Color tokens** (defined once in `src/styles/tokens.css`, referenced everywhere via Tailwind utilities or `var(--color-*)`; never hard-code hex in components):

  | Token | Hex | Sampled from | Use |
  |---|---|---|---|
  | `ink` | `#050403` | all refs | page ground (warm black, never pure #000) |
  | `ink-2` | `#120C07` | eva-magi-2 | panel interiors |
  | `nerv` | `#F7941D` | eva-magi-1 orange borders | primary orange: borders, titles, digits |
  | `nerv-hot` | `#FFB042` | eva-timer digits | bloom core of orange |
  | `amber` | `#FFC24D` | eva-timer label | secondary labels |
  | `magi` | `#6CF0B1` | eva-magi-1 / eva-magi-2 mint fills (re-sampled Task 2) | filled MAGI panels (black text on top) |
  | `acid` | `#3DF58B` | eva-text-color-ex "SHINJI IKARI" | green body text, map contours |
  | `alert` | `#FF2A1F` | eva-text-color-ex "FIRST.C", `_.gif` stripes | red: warnings, hazard stripes, map splines |
  | `alert-deep` | `#8F0E0E` | eva-magi-2 "審議中" box | red fills |
  | `plug-blue` | `#4B6BFF` | pilot-sync-2 ribbon | sync ribbon secondary strand |
  | `plug-magenta` | `#D94BFF` | pilot-sync-2 ribbon overlap | sync ribbon blend |
  | `bone` | `#EADFC4` | pilot-sync cross marks / axis | cross-hairs, rulers, muted text |
  | `steel` | `#5A5148` | — | disabled / hairlines |

- **Motion rules**: every animation checks `useReducedMotion()` (Motion) **or** the manual FX toggle. Nothing flashes faster than 3 Hz. Flicker opacity range ≤ 4%. Loading screen is skippable with Enter / click / Esc and never shown more than once per session (`sessionStorage`).
- **Accessibility**: all text ≥ 4.5:1 on `ink` (nerv, acid, bone, magi pass; `steel` is decorative only). Focus rings visible (orange 2px). Semantic landmarks (`header`, `nav`, `main`, `footer`). Skip link first in DOM.
- **Performance budget**: Lighthouse Performance ≥ 90 desktop / ≥ 80 mobile; JS ≤ 250 kB gzip; no layout shift from the CRT overlays (all `position: fixed`, `pointer-events: none`).
- **No show artwork** is bundled. Kanji and English strings that appear in the show's UI (MAGI, NERV, 提訴 / 決議 / 承認 / 否定 / 審議中, MELCHIOR-1 …) are typed text; graphics are generated.
- **Naming**: callsign `J. EMSLEY // UNIT-01`. Tabs are labelled in nav as `HOME` `PILOT` `PROJECTS` `RESUME` with kanji sub-labels (`本部` `操縦者` `作戦記録` `人事記録`).
- **Commits**: conventional commits (`feat:`, `chore:`, `test:`…), one commit per task minimum, each ending with the attribution trailer given by the harness.

---

## Reference Catalogue (`references/`)

Executors must open these before styling anything. Extract GIF frames with `ffmpeg -i <gif> -vf fps=1 frames/%02d.png` if the image reader cannot show GIFs.

| File | What it shows | Design rules extracted |
|---|---|---|
| `eva-magi-1.png` | MAGI deliberation: three mint-filled trapezoid/hex panels labelled BALTHASAR·2, CASPER·3, MELCHIOR·1 around a small "MAGI" hub, orange kanji headers (提訴 / 決議), metadata block `CODE:239 / FILE:MAGI_SYS / EXTENTION:4088 / EX_MODE:OFF / PRIORITY:AAA` | Filled panels = `magi` bg + `ink` text, ~6 px `nerv` border; metadata block = mono, orange, tracked-out, 5 rows |
| `eva-magi-2.png` | Same screen, "outline" state: orange 2 px outlined squares (some rotated), one mint filled with vertical "MELCHIOR 1", red boxed 審議中 (deliberating), thick orange frame with rounded corners around whole screen | Outline vs filled = pending vs resolved; screen has a physical bezel frame |
| `Evangelion UI - Magi report.jpeg` | Fan-made clean MAGI report: heavy phosphor glow on every stroke, mint outlined pentagon + two squares, 承認 (approve) in mint, 否定 (deny) in red, right-hand "Layer 3 / Layer 2 / Layer 1" mono list, top orange status bars with bracket ends | Canonical bloom look: 1 px crisp stroke + 6–12 px same-hue glow; layered header bars |
| `eva-map-ex.png` | Topographic map: dense `acid` contour lines with a sharp peak, `alert` splines with "R199"-style labels, white "+" registration marks in a grid | Use as Home background + Projects backdrop; contours generated from a noise heightfield |
| `eva-text-color-ex.png` | Three vertical pilot columns; `alert` red kicker (FIRST.C), `acid` green name (SHINJI IKARI), `nerv` orange name (S.ASUKA LANGLEY); bottom orange boxed labels `TEST PLUG 01 / MONITOR / CHECK O.K.` | Pilot page layout: column, kicker + name, boxed status labels; three-colour text hierarchy |
| `pilot-sync-1.gif` | Sync graph: woven sine ribbons (red→white as sync locks), cross-hair grid, ruler axis −5…+5 at bottom, mono timer `±0:02:18649` top-right, vertical dotted marker at x≈−4 | Loading screen ribbon algorithm; when sync locks the ribbon desaturates to `bone` |
| `pilot-sync-2.gif` | Same with `plug-blue` + `nerv` strands blending to magenta; boxed orange `EVA 01` and `SUBJECT: REI AYANAMI` label top-right | Loading screen label block: boxed unit + subject line |
| `eva-timer.gif` | Seven-segment orange digits `4:59:56` with heavy bloom, kanji/English label 内部 INTERNAL / 主電源供給システム MAIN ENERGY SUPPLY SYSTEM, red-black hazard stripes, `STOP SLOW NORMAL RACING` mode strip | Home page "ACTIVE TIME REMAINING" widget and hazard-stripe divider |
| `_.gif` | Wireframe orange sphere over red hazard chevrons, film grain, 危険 red badge, teal `NERV` wordmark with hatched bar | Grain intensity target; wireframe globe as Pilot/Projects decoration; hatched divider |

---

## File Structure

```
portfolio/
├── PLAN.md                      ← this document
├── index.html                   ← Google Fonts <link>, <div id="root">, noscript
├── package.json / pnpm-lock.yaml
├── vite.config.ts               ← react plugin, tailwind plugin, vitest config
├── tsconfig.json / tsconfig.app.json
├── eslint.config.js / .prettierrc
├── vercel.json                  ← SPA rewrite: all paths → /index.html
├── public/
│   ├── favicon.svg              ← orange hex "01"
│   ├── resume.pdf               ← OWNER SUPPLIES (placeholder committed)
│   └── og.png                   ← generated 1200×630 (Task 16)
├── references/                  ← untouched
├── src/
│   ├── main.tsx                 ← createRoot, <BrowserRouter>, <App/>
│   ├── App.tsx                  ← <FxProvider><CrtFrame><Routes…/></CrtFrame></FxProvider>
│   ├── routes.tsx               ← route table: /, /pilot, /projects, /resume, *
│   ├── styles/
│   │   ├── tokens.css           ← @theme colors, fonts, spacing scale
│   │   ├── base.css             ← reset, body, selection colour, focus ring, kanji utility
│   │   └── crt.css              ← scanlines, vignette, flicker, curvature, bloom classes
│   ├── fx/
│   │   ├── FxProvider.tsx       ← reduced-motion + manual toggle context, persists to localStorage
│   │   ├── useFx.ts             ← `const { motionOn, fxOn, toggleFx } = useFx()`
│   │   ├── CrtFrame.tsx         ← bezel + overlays + <PhosphorFilters/>; renders children
│   │   ├── PhosphorFilters.tsx  ← inline <svg> with #phosphor-bloom, #chroma-shift, #grain filters
│   │   └── ScanlineOverlay.tsx  ← fixed layers (scanlines, vignette, grain, flicker)
│   ├── components/
│   │   ├── chrome/
│   │   │   ├── HudHeader.tsx    ← callsign, nav tabs, live clock, FX toggle
│   │   │   ├── NavTab.tsx       ← NavLink styled as boxed orange label (TEST PLUG style)
│   │   │   ├── HudFooter.tsx    ← contact links, "MAGI SYS / EXTENTION" metadata block
│   │   │   └── SkipLink.tsx
│   │   ├── ui/                  ← signature primitives (each has a story-like demo in tests)
│   │   │   ├── MagiPanel.tsx    ← outlined | filled | denied variants, optional kanji stamp
│   │   │   ├── MetaBlock.tsx    ← CODE / FILE / EXTENTION rows
│   │   │   ├── BoxedLabel.tsx   ← "TEST PLUG 01" boxed orange label
│   │   │   ├── HazardStripe.tsx ← red/black diagonal stripe divider
│   │   │   ├── HatchBar.tsx     ← teal/mint hatched bar (from _.gif)
│   │   │   ├── SevenSegment.tsx ← digit renderer (SVG segments) w/ bloom
│   │   │   ├── StatusBar.tsx    ← bracketed orange header bar (Magi report top)
│   │   │   ├── Typewriter.tsx   ← reveals text char-by-char (motion-gated)
│   │   │   └── Kanji.tsx        ← Noto Sans JP accent with EN sub-label
│   │   └── graphics/
│   │       ├── SyncRibbon.tsx   ← canvas woven-sine sync graph (loading screen)
│   │       ├── TopoMap.tsx      ← canvas contour map + red splines + crosshairs
│   │       ├── WireGlobe.tsx    ← SVG rotating wireframe sphere
│   │       └── MagiTriad.tsx    ← SVG three-panel MAGI layout (Home hero)
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── PilotPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ResumePage.tsx
│   │   └── NotFoundPage.tsx     ← "審議中 / PATTERN UNKNOWN"
│   ├── boot/
│   │   ├── BootScreen.tsx       ← pilot-sync loading sequence, sessionStorage gate
│   │   └── useBootSequence.ts   ← state machine: syncing → locked → identity → done
│   ├── content/
│   │   ├── profile.ts           ← name, callsign, bio, photo, skills (as sync ratios)
│   │   ├── projects.ts          ← Project[]
│   │   ├── resume.ts            ← Resume (experience, education, skills, links)
│   │   ├── links.ts             ← email, github, linkedin
│   │   └── types.ts             ← shared content types
│   └── lib/
│       ├── clock.ts             ← formatTelemetryTime(date): "T+0:02:18649"
│       ├── noise.ts             ← 2-D value noise for TopoMap
│       └── cn.ts                ← clsx wrapper
└── tests/
    └── setup.ts                 ← RTL matchers, matchMedia + canvas mocks
```

**Unit boundaries:** `fx/` knows nothing about pages. `components/ui` are pure presentational (props in, JSX out, no routing, no content imports). `pages/` compose `ui` + `graphics` and read `content/`. `content/` is plain data with no React imports. `graphics/` components own their own rAF loops and must clean up on unmount and pause when `motionOn` is false.

---

## Sub-agent Assignment Summary

| Phase | Tasks | Model | Why |
|---|---|---|---|
| 0 Scaffold | 1 | Sonnet | Mechanical setup |
| 1 Design system | 2, 3, 4 | **Opus** | Token/CRT decisions define the whole look; needs taste + reference fidelity |
| 2 Chrome | 5, 6 | Sonnet | Composes primitives |
| 3 Graphics | 7, 8, 9 | **Opus** | Canvas math, perf, reference matching |
| 4 Boot screen | 10 | **Opus** | State machine + graphics integration |
| 5 Pages | 11, 12, 13, 14, 15 | Sonnet | Content layouts from a fixed design system |
| 6 Ship | 16, 17 | Sonnet then **Opus** review | Deploy, perf, a11y audit |

Task dependencies: 1 → 2 → 3 → 4 → {5, 6, 7, 8, 9} → 10 → {11, 12, 13, 14, 15} → 16 → 17. Tasks inside braces may run in parallel with `superpowers:dispatching-parallel-agents`.

---

## Phase 0 — Scaffold

### Task 1: Project scaffold, tooling, CI-grade scripts — *Sonnet*

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `index.html`, `vercel.json`, `src/main.tsx`, `src/App.tsx`, `src/routes.tsx`, `src/pages/*.tsx` (stub each page as `<h1>` only), `tests/setup.ts`, `src/lib/cn.ts`
- Test: `src/App.test.tsx`

**Interfaces produced:** `routes.tsx` exports `ROUTES = [{ path:'/', label:'HOME', kanji:'本部', element }, …]` consumed by `HudHeader` (Task 5).

- [ ] **Step 1:** `git init`; `pnpm create vite@latest . --template react-ts`; install: `react-router`, `motion`, `tailwindcss @tailwindcss/vite`, `clsx`; dev: `vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vitest-canvas-mock prettier eslint-config-prettier`.
- [ ] **Step 2:** `index.html`: `<title>J. EMSLEY // UNIT-01</title>`, meta description, theme-color `#050403`, Google Fonts link for `Barlow+Condensed:wght@700;800`, `Share+Tech+Mono`, `Noto+Sans+JP:wght@700`, `<noscript>` text.
- [ ] **Step 3:** `vite.config.ts` with `react()`, `tailwindcss()`, and `test: { environment:'jsdom', setupFiles:'tests/setup.ts', globals:true }`. `tests/setup.ts` imports `@testing-library/jest-dom/vitest`, `vitest-canvas-mock`, and stubs `window.matchMedia`.
- [ ] **Step 4:** `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- [ ] **Step 5:** Write failing test `App.test.tsx`: renders `<App/>` inside `MemoryRouter` at `/pilot` and expects heading "PILOT". Run `pnpm test` → fails.
- [ ] **Step 6:** Implement `routes.tsx`, `App.tsx` (`<Routes>` from `ROUTES` + `*` → `NotFoundPage`), stub pages. Test passes.
- [ ] **Step 7:** Scripts: `dev`, `build`, `preview`, `test`, `lint`, `format`, `typecheck` (`tsc -p tsconfig.app.json --noEmit`). All four of `lint`, `typecheck`, `test`, `build` pass.
- [ ] **Step 8:** Commit `chore: scaffold vite react-ts app with router, tailwind, vitest`.

**Acceptance:** `pnpm build` emits `dist/`; `pnpm preview` serves four navigable stub routes.

---

## Phase 1 — Design System (Opus)

### Task 2: Tokens, base styles, typography — *Opus*

**Files:** Create `src/styles/tokens.css`, `src/styles/base.css`; modify `src/main.tsx` to import both.

**Interfaces produced:** Tailwind utilities `bg-ink text-nerv border-magi font-display font-mono font-jp` etc.; CSS vars `--color-*`; utilities `.text-glow-nerv`, `.text-glow-acid`, `.text-glow-alert` (text-shadow stacks); `.display-compressed` (`transform: scaleX(.82)` + `transform-origin:left`).

- [x] **Step 1:** `tokens.css`:
  ```css
  @import "tailwindcss";
  @theme {
    --color-ink:#050403; --color-ink-2:#120C07;
    --color-nerv:#F7941D; --color-nerv-hot:#FFB042; --color-amber:#FFC24D;
    --color-magi:#6CF0B1; --color-acid:#3DF58B;
    --color-alert:#FF2A1F; --color-alert-deep:#8F0E0E;
    --color-plug-blue:#4B6BFF; --color-plug-magenta:#D94BFF;
    --color-bone:#EADFC4; --color-steel:#5A5148;
    --font-display:"Barlow Condensed",Impact,"Arial Narrow",sans-serif;
    --font-mono:"Share Tech Mono","JetBrains Mono",ui-monospace,monospace;
    --font-jp:"Noto Sans JP","Hiragino Sans",sans-serif;
    --tracking-telemetry:0.18em;
  }
  ```
- [x] **Step 2:** `base.css`: `html{background:var(--color-ink)}`, `body{color:var(--color-acid);font-family:var(--font-mono)}`, `::selection{background:var(--color-nerv);color:var(--color-ink)}`, `:focus-visible{outline:2px solid var(--color-nerv);outline-offset:2px}`, glow utilities:
  ```css
  .text-glow-nerv{ text-shadow:0 0 2px var(--color-nerv-hot),0 0 8px color-mix(in srgb,var(--color-nerv) 70%,transparent),0 0 20px color-mix(in srgb,var(--color-nerv) 35%,transparent); }
  ```
  (repeat for acid, alert, magi, bone).
- [x] **Step 3:** Test: `tokens.test.ts` reads `tokens.css` as text and asserts every token name in the Global Constraints table exists (guards against drift).
- [x] **Step 4:** Commit `feat(styles): design tokens, base, glow utilities`.

**Acceptance:** A scratch page rendering the 13 colour swatches + three fonts screenshot-compared side-by-side with `eva-text-color-ex.png` and `eva-magi-1.png`; adjust hex values if the orange reads too yellow or the green too neon (document the final values back in this table).

### Task 3: CRT layer — `CrtFrame`, `ScanlineOverlay`, `PhosphorFilters` — *Opus*

**Files:** Create `src/styles/crt.css`, `src/fx/FxProvider.tsx`, `src/fx/useFx.ts`, `src/fx/CrtFrame.tsx`, `src/fx/ScanlineOverlay.tsx`, `src/fx/PhosphorFilters.tsx`; tests `src/fx/*.test.tsx`; modify `App.tsx`.

**Interfaces produced:**
- `useFx(): { motionOn:boolean; fxOn:boolean; toggleFx():void }` — `motionOn = fxOn && !prefersReducedMotion`.
- `<CrtFrame>{children}</CrtFrame>` — sets `data-fx="on|off"` on `<html>`.
- SVG filter ids: `#phosphor-bloom`, `#chroma-shift`, `#crt-grain`. CSS classes: `.crt-bloom` (`filter:url(#phosphor-bloom)`), `.crt-chroma`.

- [ ] **Step 1:** `FxProvider`: reads `localStorage['fx']` (default `"on"`), `matchMedia('(prefers-reduced-motion: reduce)')` via `useSyncExternalStore`; exposes context. Test: toggling flips `document.documentElement.dataset.fx`.
- [ ] **Step 2:** `PhosphorFilters.tsx` — a `0×0` absolutely positioned inline SVG:
  ```xml
  <filter id="phosphor-bloom" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
    <feColorMatrix in="blur" type="matrix" values="1.4 0 0 0 0  0 1.4 0 0 0  0 0 1.4 0 0  0 0 0 0.9 0" result="glow"/>
    <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="chroma-shift">
    <feOffset in="SourceGraphic" dx="-0.7" result="r"/><feColorMatrix in="r" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rC"/>
    <feOffset in="SourceGraphic" dx="0.7" result="b"/><feColorMatrix in="b" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bC"/>
    <feBlend in="rC" in2="bC" mode="screen" result="rb"/><feBlend in="rb" in2="SourceGraphic" mode="screen"/>
  </filter>
  <filter id="crt-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  ```
- [ ] **Step 3:** `crt.css` layers (all `position:fixed; inset:0; pointer-events:none; z-index:50+`):
  - `.crt-scanlines`: `background:repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)` + `mix-blend-mode:multiply`.
  - `.crt-aperture`: faint vertical RGB triad `repeating-linear-gradient(90deg, rgba(255,0,0,.04) 0 1px, rgba(0,255,0,.04) 1px 2px, rgba(0,0,255,.04) 2px 3px)`.
  - `.crt-vignette`: `background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)`.
  - `.crt-grain`: `filter:url(#crt-grain); opacity:.06; mix-blend-mode:overlay` on a full-screen SVG rect; re-seeded via `animation: grain-shift 400ms steps(2) infinite` (translate ±2 px) → ≤ 2.5 Hz.
  - `.crt-flicker`: `animation: flicker 6s infinite` between opacity `1` and `.965` at irregular keyframes.
  - `.crt-rollbar`: slow-moving 120 px horizontal brighter band, `animation: roll 9s linear infinite`.
  - `.crt-bezel`: on the frame wrapper — `border-radius:18px; box-shadow: inset 0 0 80px rgba(0,0,0,.8), inset 0 0 4px rgba(247,148,29,.25); margin:8px` plus `outline: 6px solid #0b0806` — mimics the `eva-magi-2` orange-lipped tube frame.
  - Global soft blur: `.crt-content{ filter: blur(.25px) contrast(1.05) saturate(1.15); }` on the content wrapper (not overlays).
  - All animations + blur are disabled under `html[data-fx="off"]` and `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 4:** `ScanlineOverlay` renders the layers; `CrtFrame` = bezel → `.crt-content` children → `ScanlineOverlay` → `PhosphorFilters`. Test: with `data-fx="off"`, no element has class `crt-flicker` animating (assert `getComputedStyle` animation-name is `none` or overlay not rendered).
- [ ] **Step 5:** Wire into `App.tsx`; commit `feat(fx): CRT frame with scanlines, vignette, grain, bloom filters, FX toggle`.

**Acceptance:** Screenshot of stub Home with a large orange heading using `.text-glow-nerv` + `.crt-bloom` visually matches the stroke-plus-halo look of `Evangelion UI - Magi report.jpeg`. Scanlines are visible at 100% zoom on a 1440p monitor. Chrome DevTools Performance shows ≤ 3% CPU idle on an M-series Mac with overlays on.

### Task 4: Signature UI primitives — *Opus*

**Files:** Create everything in `src/components/ui/` listed in File Structure, each with a `*.test.tsx`.

**Interfaces produced (exact props):**
```ts
MagiPanel: { variant:'outline'|'filled'|'denied'; title:string; index?:1|2|3; stamp?:'承認'|'否定'|'審議中'; shape?:'square'|'pentagon'|'trapezoid'; rotate?:number; children?:ReactNode }
MetaBlock: { rows: Array<[label:string, value:string]> }   // renders "CODE : 239" style, mono, nerv
BoxedLabel: { children:ReactNode; tone?:'nerv'|'acid'|'alert'|'magi'; as?:'span'|'a'|'button' }
HazardStripe: { height?:number; label?:string }              // red/black 45° stripes, optional centred kanji
HatchBar: { tone?:'magi'|'nerv' }                            // thin diagonal hatch (NERV wordmark bar)
SevenSegment: { value:string; size?:number; tone?:'nerv'|'alert' }  // digits 0-9 and ':' as SVG segments
StatusBar: { children:ReactNode; tone?:'nerv'|'alert' }     // bracketed header bar
Typewriter: { text:string; cps?:number; onDone?():void }    // instant when motionOn=false
Kanji: { jp:string; en:string; tone?:'nerv'|'acid'|'alert' }
```

- [ ] **Step 1:** For each primitive: write RTL test (renders, variant classes, `Typewriter` finishes instantly with motion off), implement, verify.
- [ ] **Step 2:** `MagiPanel` shapes via `clip-path: polygon(...)` with an inner pseudo-border trick (outer clipped `nerv` div, inner clipped `ink-2`/`magi` div inset 5 px) so thick orange borders survive clipping. `denied` = `alert` border + red stamp.
- [ ] **Step 3:** `SevenSegment`: segment map table `{0:'abcdef',1:'bc',…}`, each segment a rounded `<polygon>`; lit segments `nerv-hot` with `.crt-bloom`, unlit `#2a1a08` at 25% so the "ghost segments" from `eva-timer.gif` show.
- [ ] **Step 4:** Create `src/pages/DevKitPage.tsx` at route `/kit` (dev-only, excluded from nav; removed in Task 17) rendering every primitive in every variant.
- [ ] **Step 5:** Commit `feat(ui): MAGI primitives (panel, meta block, boxed label, hazard, seven-segment, typewriter)`.

**Acceptance:** `/kit` screenshot compared with `eva-magi-1.png`, `eva-magi-2.png`, `eva-timer.gif`: panel border thickness, mint fill, digit shape and bloom judged "recognisable at a glance".

---

## Phase 2 — Chrome (Sonnet)

### Task 5: `HudHeader`, `NavTab`, `SkipLink` — *Sonnet*

**Files:** `src/components/chrome/HudHeader.tsx`, `NavTab.tsx`, `SkipLink.tsx`, tests; modify `App.tsx`; create `src/lib/clock.ts` (+ test).

**Consumes:** `ROUTES` (Task 1), `BoxedLabel`, `Kanji`, `useFx`. **Produces:** `formatTelemetryTime(d:Date):string` → `"T+HH:MM:SS.mmm"`-style `+0:38:50909` look (hours:minutes:seconds+ms, no leading zero on hours).

- [ ] **Step 1:** Layout (desktop): left = `J. EMSLEY` in `font-display` `display-compressed` nerv glow, under it `UNIT-01 // PILOT TERMINAL` mono bone; centre = four `NavTab`s (`BoxedLabel` with `Kanji` sub-label; active tab = filled `magi` bg + ink text like a resolved MAGI panel, inactive = orange outline); right = live clock (`StatusBar`, 100 ms tick, mono) and FX toggle button `FX ON/OFF`.
- [ ] **Step 2:** Mobile (< 768 px): tabs become a 4-column bottom bar (`position:fixed; bottom:0`); header collapses to callsign + clock.
- [ ] **Step 3:** Tests: active tab has `aria-current="page"`; clock renders `T+` prefix; `SkipLink` targets `#main`.
- [ ] **Step 4:** Commit `feat(chrome): HUD header with nav tabs, telemetry clock, FX toggle`.

### Task 6: `HudFooter` + content types + links — *Sonnet*

**Files:** `src/content/types.ts`, `src/content/links.ts`, `src/components/chrome/HudFooter.tsx` (+ test).

**Produces:**
```ts
export type Link = { label:string; href:string; kind:'email'|'github'|'linkedin'|'other' };
export type Skill = { name:string; ratio:number /* 0-100 */; group:'lang'|'framework'|'tool'|'domain' };
export type Project = { id:string; code:string /* e.g. "OP-013" */; title:string; kanji?:string; summary:string; stack:string[]; status:'ACTIVE'|'COMPLETE'|'ARCHIVED'; year:number; links:Link[]; highlights:string[] };
export type ResumeEntry = { org:string; role:string; start:string /* YYYY-MM */; end?:string; bullets:string[]; location?:string };
export type Resume = { experience:ResumeEntry[]; education:ResumeEntry[]; skills:Skill[]; certifications?:string[]; pdf:string };
export type Profile = { name:string; callsign:string; unit:string; title:string; oneLiner:string; bio:string[]; photo?:string; skills:Skill[]; location:string; status:'AVAILABLE'|'ENGAGED' };
```
- [ ] **Step 1:** `links.ts` with `mailto:jtey20@gmail.com`, `https://github.com/jemsley06`, `https://www.linkedin.com/in/jason-emsley` (mark in a comment: **OWNER TO CONFIRM**).
- [ ] **Step 2:** Footer: `HazardStripe` top, `MetaBlock` rows `[['CODE','01'],['FILE','PORTFOLIO_SYS'],['EXTENTION','2026'],['EX_MODE','ON'],['PRIORITY','AAA']]`, three `BoxedLabel as="a"` links, right-aligned `NERV`-style wordmark in `magi` with `HatchBar`.
- [ ] **Step 3:** Test: three links with correct hrefs and `rel="noopener"`. Commit `feat(chrome): footer with contact links and MAGI metadata`.

---

## Phase 3 — Generated Graphics (Opus)

### Task 7: `SyncRibbon` canvas — *Opus*

**Files:** `src/components/graphics/SyncRibbon.tsx` (+ test using canvas mock).

**Produces:** `<SyncRibbon phase:'syncing'|'locked'|'static'; progress:number /*0-1*/; height?:number />`.

Algorithm (matches `pilot-sync-1/2.gif`):
- Two strand families, A (`nerv`→`plug-magenta`) and B (`plug-blue`→`plug-magenta`), each **24 sine strands** with the same wavelength (≈ 1.1 × canvas width) but phase offsets spread across ±0.35 rad and amplitude `0.36·h ± 6%`, so they form a woven ribbon with visible nodes where strands cross.
- Every 18 px along x, draw short "rung" segments between adjacent strands → the ladder/lattice texture in the GIF.
- Time animates phase `t += 0.9 rad/s`. `progress` drives B-family phase toward A-family (from π/2 apart to 0): at `progress = 1` the ribbons overlap. In `locked` phase, colours lerp to `bone` over 600 ms (exactly what `pilot-sync-1.gif` does when the sync succeeds).
- Overlay: white-`bone` `+` registration marks on an 8×3 grid, dotted vertical marker at x = 12 % (blinks 1 Hz), top rule and bottom ruler with major ticks labelled −5…+5 in mono `bone`.
- `globalCompositeOperation='lighter'` for the strand pass so overlaps bloom; each strand `lineWidth 1`, `alpha .55`.
- `static` phase (reduced motion): draws a single frame at `progress=1`.
- rAF loop cancelled on unmount; `devicePixelRatio` aware; resizes via `ResizeObserver`.

- [ ] Write test: component mounts, calls `getContext('2d')`, cancels rAF on unmount (spy on `cancelAnimationFrame`).
- [ ] Implement; add to `/kit`. Commit `feat(graphics): SyncRibbon woven sine canvas`.

**Acceptance:** Side-by-side with `pilot-sync-2.gif` frame at 50% width: same ribbon pitch, same axis, node lattice visible.

### Task 8: `TopoMap` canvas + `noise.ts` — *Opus*

**Files:** `src/lib/noise.ts` (+ test: deterministic for a seed, range [0,1]), `src/components/graphics/TopoMap.tsx`.

**Produces:** `<TopoMap seed?:number; peaks?:Array<{x:number;y:number;h:number}>; density?:number; className? />` — absolutely positioned decorative background (`aria-hidden`).

- Heightfield = 3-octave value noise + Gaussian peaks (one sharp peak by default at 50 %,45 %, like `eva-map-ex.png`).
- Marching squares at 22 iso-levels → polylines in `acid` (1 px, alpha .8; every 5th level 1.5 px). This is the contour texture.
- 4–6 `alert` red splines (Catmull-Rom through random points) with mono labels `R199 / R203 / …` at spline ends.
- `bone` `+` marks on a 7×5 grid.
- Static (drawn once per resize); optional slow drift (`translateY` 4 px over 20 s) when `motionOn`.
- [ ] Tests for noise; mount test; add to `/kit`; commit `feat(graphics): TopoMap contour background`.

### Task 9: `WireGlobe` + `MagiTriad` SVG — *Opus*

**Files:** `src/components/graphics/WireGlobe.tsx`, `MagiTriad.tsx` (+ tests).

- `WireGlobe`: 12 meridians + 7 parallels projected orthographically, rotates around a tilted axis (`motionOn` → 30 s/rev via `requestAnimationFrame` updating a `rotation` state at 15 fps max), stroke `nerv`, `.crt-bloom`. Props `{ size?:number; tone?:'nerv'|'alert' }`.
- `MagiTriad`: the three-panel composition from `eva-magi-1.png`: BALTHASAR·2 top (pentagon pointing down), CASPER·3 bottom-left, MELCHIOR·1 bottom-right, connecting "MAGI" hub with three orange link bars; each panel accepts `{ name, index, state:'pending'|'approved'|'denied' }` so pages can animate deliberation (Home shows all three flipping to 承認 in sequence). Built from `MagiPanel`s positioned in a CSS grid, not raw SVG, so text stays DOM.
- [ ] Tests; `/kit`; commit `feat(graphics): WireGlobe and MagiTriad`.

---

## Phase 4 — Boot / Loading Screen (Opus)

### Task 10: `BootScreen` + `useBootSequence` — *Opus*

**Files:** `src/boot/useBootSequence.ts` (+ test with fake timers), `src/boot/BootScreen.tsx` (+ test); modify `App.tsx`.

**Produces:** `useBootSequence(opts:{ motionOn:boolean }): { phase:'syncing'|'locked'|'identity'|'done'; progress:number; ratio:number; skip():void }`.

State machine (total ≈ 4.2 s, all timings constants at top of file):
1. `syncing` (0–2600 ms): `progress` eases 0→1 (`easeInOutCubic`), `ratio` counts 0.0 → 41.3 % in mono `nerv` top-right as `SYNC RATIO 41.3%`; timer `±0:02:18649` counts up. Label block top-right, exactly like `pilot-sync-2.gif`: `BoxedLabel` `EVA 01` above `SUBJECT:` / `J. EMSLEY` in nerv glow.
2. `locked` (2600–3300): ribbon desaturates to `bone`; `HARMONICS LOCKED` stamp in `magi` flashes on (once).
3. `identity` (3300–4200): ribbon fades to 20 %, centre shows `Typewriter` `J. EMSLEY // UNIT-01` display font + `PILOT TERMINAL ONLINE` + `ENTER ▸` boxed label.
4. `done`: `BootScreen` unmounts with a 300 ms opacity fade; sets `sessionStorage['booted']='1'`.

Rules: `skip()` on Enter / Space / Esc / click → jumps to `done`. If `motionOn` is false or `sessionStorage.booted` is set: initial phase `done` (never render). `BootScreen` is `role="dialog" aria-label="Pilot synchronisation"` with `aria-live="polite"` ratio text; body scroll locked while shown; everything under it is `inert`.

- [ ] Test with `vi.useFakeTimers()`: phases advance at the constants; `skip()` sets done; booted flag respected.
- [ ] Implement; compose `SyncRibbon` full-bleed (height 60 vh), top rule and ruler; commit `feat(boot): pilot-sync loading screen`.

**Acceptance:** Screen recording of first load compared with `pilot-sync-2.gif`. Second navigation within the tab shows no boot screen. `prefers-reduced-motion` skips it entirely.

---

## Phase 5 — Pages (Sonnet)

Every page: `<main id="main">`, a `StatusBar` page header (`Kanji` + English title + `MetaBlock` with `CODE`/`FILE`/`PRIORITY` values unique to the page), dense multi-column grid at ≥ 1024 px, single column below 768 px. Page transitions: `motion` fade+2 px slide, 200 ms, gated.

### Task 11: Content files — *Sonnet*

**Files:** `src/content/profile.ts`, `projects.ts`, `resume.ts` (+ `content.test.ts` validating shapes: ratios 0–100, dates `YYYY-MM`, unique project ids, pdf path exists in `public/`).

- [ ] Fill with **clearly marked placeholder** copy (`// OWNER: replace`) in the correct voice: terse, uppercase labels, telemetry flavour. 3 projects, 2 experience entries, 1 education entry, 12 skills. `public/resume.pdf` = one-page placeholder PDF generated with a script (`scripts/make-placeholder-pdf.mjs` using `pdf-lib`) so the download link works.
- [ ] Commit `feat(content): typed placeholder content`.

### Task 12: `HomePage` — *Sonnet*

Layout (desktop, 12-col grid over a full-bleed `TopoMap`):
- Rows 1: `StatusBar`s stacked like the Magi report top: `DIRECT LINK CONNECTION: UNIT-01` / `ACCESS MODE: VISITOR`.
- Left 7 cols: `MagiTriad` with names MELCHIOR·1 / BALTHASAR·2 / CASPER·3; on mount (motion on) each flips pending→approved 400 ms apart; hub text `MAGI`. Below it `Typewriter` one-liner from `profile.oneLiner` in `acid`.
- Right 5 cols: "ACTIVE TIME REMAINING" widget (`eva-timer.gif`): `Kanji jp="内部" en="INTERNAL"`, `SevenSegment` showing time since page load `H:MM:SS` ticking; mode strip `STOP SLOW NORMAL RACING` with `RACING` lit `alert`. Under it a `MetaBlock` of profile facts (`STATUS AVAILABLE`, `LOCATION`, `UNIT 01`).
- Bottom: `HazardStripe label="危険"` then three `BoxedLabel as="a"` quick links to PILOT / PROJECTS / RESUME.
- [ ] Test: renders callsign, three MAGI names, quick links. Commit `feat(pages): home dashboard`.

### Task 13: `PilotPage` — *Sonnet*

Layout mirrors `eva-text-color-ex.png` three columns:
- Col 1 (`alert` kicker `FIRST.C` style → `PILOT` / name in `acid` display font): "test plug" card — `profile.photo` or generated monogram `JE` in a tall rounded-rect frame with orange inner border and vertical scan gradient; bottom `BoxedLabel`s `TEST PLUG 01`, `MONITOR`, `CHECK O.K.`.
- Col 2: `PERSONNEL DATA` `MetaBlock` (name, unit, location, status) + bio paragraphs in `acid` with orange first-letter drop caps.
- Col 3: `SYNC RATIOS` — skills grouped by `group`; each skill = label + horizontal segmented bar (20 segments, lit `nerv`, unlit `steel`) + `ratio%` mono; animate fill on mount (gated). `WireGlobe` decorative behind col 3 at 25% opacity.
- [ ] Test: renders every skill name; bars have `role="meter"` with `aria-valuenow`. Commit `feat(pages): pilot profile`.

### Task 14: `ProjectsPage` — *Sonnet*

- Header: `Kanji jp="作戦記録" en="OPERATION LOG"`.
- Grid of `MagiPanel variant="outline"` cards (2 cols ≥ 1024 px, 3 cols ≥ 1440 px). Card: `code` boxed top-left, `status` stamp top-right (`ACTIVE` → 審議中 amber, `COMPLETE` → 承認 magi, `ARCHIVED` → steel), title in display font, summary, stack as tiny `BoxedLabel`s, links row. Hover/focus: panel flips to `filled` variant (mint) with black text, 150 ms.
- Optional filter row of `BoxedLabel as="button"` by status (`ALL / ACTIVE / COMPLETE / ARCHIVED`), state in URL search param `?status=`.
- `TopoMap` at 35% opacity behind grid, `peaks` positioned under the first card.
- [ ] Tests: all projects render; filtering hides non-matching; links external. Commit `feat(pages): projects operation log`.

### Task 15: `ResumePage` — *Sonnet*

- Header `Kanji jp="人事記録" en="SERVICE RECORD"`; right: `BoxedLabel as="a" href={resume.pdf} download` `DOWNLOAD PDF ▸` plus `PRINT` button (`window.print()`).
- Two-column: left `EXPERIENCE` timeline — vertical orange rail with hex nodes, each `ResumeEntry` as `StatusBar` (role @ org, date range mono) + bullets; right `EDUCATION`, `SKILLS` (compact grid of `BoxedLabel`s grouped), `CERTIFICATIONS`.
- `@media print`: hide CRT overlays, nav, globe; black-on-white; keep structure. Implemented in `crt.css` + `ResumePage.module.css`.
- [ ] Tests: entries render, download link has `download` attribute. Commit `feat(pages): resume service record with PDF download`.

Also in this phase: `NotFoundPage` — `MagiPanel variant="denied" stamp="否定"` with `PATTERN: UNKNOWN / CODE: 404` and a link home. (Sonnet, fold into Task 12 commit.)

---

## Phase 6 — Ship

### Task 16: SEO, OG image, deploy — *Sonnet*

- [ ] `index.html` meta: description, `og:title`, `og:image` (`/og.png`), `twitter:card`. Generate `public/og.png` by screenshotting `/` at 1200×630 with FX on via `scripts/og.mjs` (Playwright, dev dependency) — reproducible, no hand-made art.
- [ ] `public/favicon.svg`: orange hexagon with `01`.
- [ ] Remove nothing yet; run `pnpm build && pnpm preview`, verify all routes + deep-link refresh (Vercel rewrite locally via `preview` fallback).
- [ ] `git remote add origin …` (owner supplies repo) and Vercel project link. Commit `chore: seo meta, og image, favicon`.

### Task 17: Audit & hardening — *Opus*

- [ ] Delete `/kit` route and `DevKitPage` (keep primitives' tests).
- [ ] Lighthouse (desktop + mobile) on `preview`: Performance ≥ 90/80, Accessibility ≥ 95, Best Practices ≥ 95. Fix findings.
- [ ] axe-core run via `@axe-core/playwright` on all four routes: zero serious/critical.
- [ ] Manual checks: keyboard-only tour (skip link → tabs → cards → footer), FX OFF renders a clean flat terminal (no overlays, no blur, glow reduced to 1 layer), `prefers-reduced-motion` skips boot, 400 px viewport has no horizontal scroll, Safari renders SVG filters (fallback: `@supports not (filter:url(#x))` → text-shadow only).
- [ ] Bundle check: `pnpm build` report ≤ 250 kB gzip JS; lazy-load `ResumePage` and `ProjectsPage` with `React.lazy` if over.
- [ ] Final screenshot set (`docs/screens/*.png`, one per route + boot) attached to the closing commit `chore: audit pass, remove dev kit`.

---

## Verification (end-to-end)

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all green.
2. `pnpm preview` → open `/`: boot screen plays (ribbon weaves, ratio climbs to 41.3 %, HARMONICS LOCKED, identity typewriter, ENTER); press Enter → Home dashboard with MAGI triad flipping to 承認, seven-segment clock ticking, contour map behind.
3. Reload → no boot screen (session flag). New tab → boot screen again.
4. Toggle `FX OFF` → overlays and blur vanish, page still readable; reload persists the choice.
5. Navigate all four tabs via keyboard; each has the correct kanji header and unique `MetaBlock`.
6. Resume `DOWNLOAD PDF` fetches `/resume.pdf`; `PRINT` preview is black-on-white.
7. Compare screenshots with `references/` per each task's Acceptance line.

---

## Owner Follow-ups (not blocking build)

- Replace placeholder copy in `src/content/*.ts` and `public/resume.pdf`.
- Confirm GitHub / LinkedIn URLs in `src/content/links.ts`.
- Provide a pilot photo (`public/pilot.jpg`) or keep the monogram.
- Create the GitHub repo and Vercel project for Task 16.
