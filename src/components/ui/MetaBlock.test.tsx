import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetaBlock } from './MetaBlock'

const ROWS: Array<[string, string]> = [
  ['CODE', '239'],
  ['FILE', 'MAGI_SYS'],
  ['EXTENTION', '4088'],
  ['EX_MODE', 'OFF'],
  ['PRIORITY', 'AAA'],
]

describe('MetaBlock', () => {
  it('renders every row as a term/description pair', () => {
    render(<MetaBlock rows={ROWS} />)

    const block = screen.getByTestId('meta-block')
    expect(block.querySelectorAll('dt')).toHaveLength(5)
    expect(block.querySelectorAll('dd')).toHaveLength(5)
    for (const [label, value] of ROWS) {
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('sets the first row larger, the way every MAGI screen does', () => {
    render(<MetaBlock rows={ROWS} />)

    const rows = screen.getByTestId('meta-block').children
    expect(rows[0]).toHaveClass('text-xl')
    expect(rows[1]).toHaveClass('text-xs')
  })

  it('hides the decorative colon from assistive tech', () => {
    render(<MetaBlock rows={[['CODE', '239']]} />)

    const colon = screen.getByText(':')
    expect(colon).toHaveAttribute('aria-hidden', 'true')
  })

  it('tolerates repeated labels', () => {
    render(
      <MetaBlock
        rows={[
          ['CODE', '01'],
          ['CODE', '02'],
        ]}
      />,
    )

    expect(screen.getAllByText('CODE')).toHaveLength(2)
  })
})
