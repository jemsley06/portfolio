import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkipLink } from './SkipLink'

describe('SkipLink', () => {
  it('links to #main', () => {
    render(<SkipLink />)

    const link = screen.getByRole('link', { name: 'SKIP TO MAIN CONTENT' })
    expect(link).toHaveAttribute('href', '#main')
  })

  it('is visually hidden until focused', () => {
    render(<SkipLink />)

    const link = screen.getByRole('link', { name: 'SKIP TO MAIN CONTENT' })
    expect(link).toHaveClass('sr-only')
  })
})
