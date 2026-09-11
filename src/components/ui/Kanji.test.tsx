import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Kanji } from './Kanji'

describe('Kanji', () => {
  it('renders the kanji tagged as Japanese with its English gloss', () => {
    render(<Kanji jp="内部" en="INTERNAL" />)

    const jp = screen.getByText('内部')
    expect(jp).toHaveAttribute('lang', 'ja')
    expect(jp).not.toHaveAttribute('aria-hidden')
    expect(screen.getByTestId('kanji')).toHaveTextContent('内部INTERNAL')
  })

  it('reads as one group so the gloss follows the kanji', () => {
    render(<Kanji jp="本部" en="HOME" />)

    const group = screen.getByTestId('kanji')
    expect(group.children).toHaveLength(2)
    expect(group.children[0]).toHaveTextContent('本部')
    expect(group.children[1]).toHaveTextContent('HOME')
  })

  it('carries each tone', () => {
    const { rerender } = render(<Kanji jp="決議" en="RESOLUTION" />)
    expect(screen.getByTestId('kanji')).toHaveClass('text-nerv')

    rerender(<Kanji jp="決議" en="RESOLUTION" tone="acid" />)
    expect(screen.getByTestId('kanji')).toHaveClass('text-acid')

    rerender(<Kanji jp="危険" en="DANGER" tone="alert" />)
    expect(screen.getByTestId('kanji')).toHaveClass('text-alert')
  })
})
