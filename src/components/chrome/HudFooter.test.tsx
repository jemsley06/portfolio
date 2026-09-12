import { render, screen } from '@testing-library/react'
import { HudFooter } from './HudFooter'
import { LINKS } from '../../content/links'

describe('HudFooter', () => {
  it('renders as the contentinfo landmark', () => {
    render(<HudFooter />)
    expect(
      screen.getByRole('contentinfo', { hidden: false }),
    ).toBeInTheDocument()
  })

  it('renders the MAGI metadata block, including the show-accurate misspelling', () => {
    render(<HudFooter />)

    const meta = screen.getByTestId('meta-block')
    expect(meta).toHaveTextContent('CODE')
    expect(meta).toHaveTextContent('01')
    expect(meta).toHaveTextContent('FILE')
    expect(meta).toHaveTextContent('PORTFOLIO_SYS')
    expect(meta).toHaveTextContent('EXTENTION')
    expect(meta).toHaveTextContent('2026')
    expect(meta).toHaveTextContent('EX_MODE')
    expect(meta).toHaveTextContent('ON')
    expect(meta).toHaveTextContent('PRIORITY')
    expect(meta).toHaveTextContent('AAA')
  })

  it('renders one contact link per entry in links.ts, with the right hrefs', () => {
    render(<HudFooter />)

    const nav = screen.getByRole('navigation', { name: 'Contact' })
    const links = nav.querySelectorAll('a')
    expect(links).toHaveLength(LINKS.length)

    for (const link of LINKS) {
      const anchor = screen.getByRole('link', { name: link.label })
      expect(anchor).toHaveAttribute('href', link.href)
    }
  })

  it('does not open the mailto link in a new tab', () => {
    render(<HudFooter />)

    const email = screen.getByRole('link', { name: 'EMAIL' })
    expect(email).toHaveAttribute('href', 'mailto:jtey20@gmail.com')
    expect(email).not.toHaveAttribute('target')
    expect(email).not.toHaveAttribute('rel')
  })

  it('opens external contact links in a new tab with rel=noopener noreferrer', () => {
    render(<HudFooter />)

    for (const name of ['GITHUB', 'LINKEDIN']) {
      const anchor = screen.getByRole('link', { name })
      expect(anchor).toHaveAttribute('target', '_blank')
      // BoxedLabel supplies this itself whenever target="_blank" — asserting
      // the real behaviour rather than a value this component sets directly.
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('renders the decorative hazard stripe and hatch bar as aria-hidden', () => {
    render(<HudFooter />)

    expect(screen.getByTestId('hazard-stripe-bands')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByTestId('hatch-bar')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('renders the NERV wordmark as real text', () => {
    render(<HudFooter />)
    expect(screen.getByText('NERV')).toBeInTheDocument()
  })
})
