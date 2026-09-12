/* ---------------------------------------------------------------------------
 * Shared content types (PLAN Task 6).
 *
 * Plain TypeScript only — no React import, per the File Structure "unit
 * boundaries" note: `content/` is data, `pages/` and `components/` do the
 * rendering. Copied verbatim from the PLAN's "Produces" block so Tasks 11-15
 * (profile.ts, projects.ts, resume.ts, and the pages that read them) are
 * written against a stable shape.
 * ------------------------------------------------------------------------- */

export type Link = {
  label: string
  href: string
  kind: 'email' | 'github' | 'linkedin' | 'other'
}

export type Skill = {
  name: string
  ratio: number // 0-100
  group: 'lang' | 'framework' | 'tool' | 'domain'
}

export type Project = {
  id: string
  code: string // e.g. "OP-013"
  title: string
  summary: string
  stack: string[]
  status: 'ACTIVE' | 'COMPLETE' | 'ARCHIVED'
  year: number
  links: Link[]
  highlights: string[]
}

export type ResumeEntry = {
  org: string
  role: string
  start: string // YYYY-MM
  end?: string
  bullets: string[]
  location?: string
}

export type Resume = {
  experience: ResumeEntry[]
  education: ResumeEntry[]
  skills: Skill[]
  certifications?: string[]
  pdf: string
}

export type Profile = {
  name: string
  callsign: string
  unit: string
  title: string
  oneLiner: string
  bio: string[]
  photo?: string
  skills: Skill[]
  location: string
  status: 'AVAILABLE' | 'ENGAGED'
}
