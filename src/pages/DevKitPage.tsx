/* ---------------------------------------------------------------------------
 * DevKitPage — the `/kit` primitive gallery.
 *
 * DEV ONLY. Task 17 deletes this file and its route; nothing else may import
 * it, and it is deliberately self-contained: no content files, no chrome, no
 * shared layout, so removing it later is a two-line change in `App.tsx` plus
 * this file. It is not in `ROUTES`, so it never appears in the nav.
 *
 * It exists to be compared side by side with `references/eva-magi-1.png`,
 * `eva-magi-2.png` and `eva-timer.gif` — every primitive, every variant.
 * ------------------------------------------------------------------------- */
import type { ReactNode } from 'react'
import { MagiTriad } from '../components/graphics/MagiTriad'
import { TopoMap } from '../components/graphics/TopoMap'
import { BoxedLabel } from '../components/ui/BoxedLabel'
import { HatchBar } from '../components/ui/HatchBar'
import { HazardStripe } from '../components/ui/HazardStripe'
import { MagiPanel } from '../components/ui/MagiPanel'
import { MetaBlock } from '../components/ui/MetaBlock'
import { SevenSegment } from '../components/ui/SevenSegment'
import { StatusBar } from '../components/ui/StatusBar'
import { Typewriter } from '../components/ui/Typewriter'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-steel pt-6">
      <h2 className="font-mono text-xs tracking-telemetry text-bone">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function DevKitPage() {
  return (
    <main id="main" className="flex flex-col gap-10 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-glow-nerv text-4xl">DEV KIT</h1>
        <p className="font-mono text-xs tracking-telemetry text-bone">
          SIGNATURE PRIMITIVES — NOT A SHIPPING ROUTE (REMOVED IN TASK 17)
        </p>
      </header>

      <Section title="MAGI PANEL — VARIANTS / SHAPES / STAMPS">
        <div className="flex flex-wrap items-start gap-8">
          <MagiPanel
            variant="outline"
            title="BALTHASAR"
            index={2}
            shape="pentagon"
            stamp="APPROVED"
            className="h-64 w-64"
          />
          <MagiPanel
            variant="filled"
            title="MELCHIOR"
            index={1}
            shape="trapezoid"
            className="h-64 w-64"
          />
          <MagiPanel
            variant="denied"
            title="CASPER"
            index={3}
            stamp="DENIED"
            className="h-64 w-64"
          />
          <MagiPanel
            variant="outline"
            title="PENDING"
            stamp="PENDING"
            rotate={-14}
            className="h-48 w-48"
          />
          <MagiPanel
            variant="filled"
            title="UNIT-01"
            shape="square"
            rotate={9}
            className="h-48 w-48"
          >
            <span className="font-display text-5xl leading-none">01</span>
          </MagiPanel>
        </div>
      </Section>

      <Section title="MAGI TRIAD — CHAMFERED SLABS AROUND A HEXAGONAL HUB">
        <p className="font-mono text-xs tracking-telemetry text-bone">
          COMPARE WITH references/eva-magi-1.png — CHAMFER ANGLE, HUB SIZE,
          GUTTER WIDTH, CONNECTOR BAR THICKNESS
        </p>
        <div className="flex flex-col gap-10 xl:flex-row">
          <MagiTriad className="max-w-2xl" />
          <MagiTriad
            className="max-w-2xl"
            rotate={0}
            units={[
              { name: 'BALTHASAR', index: 2, state: 'approved' },
              { name: 'CASPER', index: 3, state: 'approved' },
              { name: 'MELCHIOR', index: 1, state: 'denied' },
            ]}
          />
        </div>
        <div className="max-w-xs">
          {/* A single chamfered slab, the shape reused as a project card. */}
          <MagiPanel
            variant="filled"
            title="OP-013"
            chamfer="top-right"
            className="h-40 w-full"
          />
        </div>
      </Section>

      <Section title="TOPO MAP — PROFILE-LINE TERRAIN (WEST LAFAYETTE / PURDUE)">
        <div className="relative h-[26rem] w-full border border-steel">
          <TopoMap />
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="relative h-64 w-[30rem] border border-steel">
            <TopoMap
              view={{ x: 0.22, y: 0.2, width: 0.48, height: 0.46 }}
              relief={1.3}
              lines={34}
              opacity={0.6}
            />
          </div>
          <div className="relative h-64 w-[30rem] border border-steel">
            <TopoMap source="noise" seed={7} opacity={0.6} />
          </div>
        </div>
        <div className="relative h-40 w-full border border-steel">
          <TopoMap
            view={{ x: 0.1, y: 0.35, width: 0.8, height: 0.3 }}
            relief={1.4}
            lines={22}
            registration={false}
          />
        </div>
      </Section>

      <Section title="META BLOCK">
        <MetaBlock
          rows={[
            ['CODE', '239'],
            ['FILE', 'MAGI_SYS'],
            ['EXTENTION', '4088'],
            ['EX_MODE', 'OFF'],
            ['PRIORITY', 'AAA'],
          ]}
        />
      </Section>

      <Section title="STATUS BAR">
        <div className="flex max-w-xl flex-col gap-2">
          <StatusBar>DIRECT LINK CONNECTION: UNIT-01</StatusBar>
          <StatusBar>ACCESS MODE: VISITOR</StatusBar>
          <StatusBar tone="alert">
            RESULT OF THE DELIBERATION: MOTION SELFDESTRUCTION
          </StatusBar>
        </div>
      </Section>

      <Section title="BOXED LABEL — TONES / ELEMENTS">
        <div className="flex flex-wrap items-center gap-3">
          <BoxedLabel>TEST PLUG 01</BoxedLabel>
          <BoxedLabel tone="acid">MONITOR</BoxedLabel>
          <BoxedLabel tone="alert">CHECK O.K.</BoxedLabel>
          <BoxedLabel tone="magi">SYNC</BoxedLabel>
          <BoxedLabel as="a" href="/" aria-current="page">
            HOME (LINK)
          </BoxedLabel>
          <BoxedLabel as="button" tone="magi">
            FILTER (BUTTON)
          </BoxedLabel>
        </div>
      </Section>

      <Section title="SEVEN SEGMENT">
        <div className="flex flex-col gap-6">
          <SevenSegment value="4:59:56" size={72} />
          <SevenSegment value="0123456789" size={40} />
          <SevenSegment value="00:00" size={40} tone="alert" />
          <SevenSegment value="1X 2" size={40} />
        </div>
      </Section>

      <Section title="HAZARD STRIPE / HATCH BAR">
        <div className="flex flex-col gap-6">
          <HazardStripe />
          <HazardStripe height={40} label="DANGER" />
          <div className="flex items-center gap-4">
            <HatchBar className="h-6 w-48" />
            <span className="font-display text-magi text-glow-magi text-3xl">
              NERV
            </span>
            <HatchBar tone="nerv" className="h-6 w-48" />
          </div>
        </div>
      </Section>

      <Section title="TYPEWRITER">
        <div className="flex flex-col gap-2 text-acid">
          <Typewriter text="PILOT TERMINAL ONLINE — ALL SYSTEMS NOMINAL." />
          <Typewriter text="SLOW SPOOL AT 8 CPS." cps={8} />
        </div>
      </Section>
    </main>
  )
}
