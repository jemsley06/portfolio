/* ---------------------------------------------------------------------------
 * links.ts — the only "contact" surface this static site has (Global
 * Constraints: no server, no API routes — contact is links only).
 *
 * `label` is the boxed-chip text `HudFooter` renders; `kind` lets a consumer
 * pick an icon/tone per link without string-matching the URL.
 * ------------------------------------------------------------------------- */
import type { Link } from './types'

export const LINKS: Link[] = [
  {
    label: 'EMAIL',
    href: 'mailto:jtey20@gmail.com',
    kind: 'email',
  },
  {
    label: 'GITHUB',
    // OWNER TO CONFIRM
    href: 'https://github.com/jemsley06',
    kind: 'github',
  },
  {
    label: 'LINKEDIN',
    // OWNER TO CONFIRM
    href: 'https://www.linkedin.com/in/jason-emsley',
    kind: 'linkedin',
  },
]
