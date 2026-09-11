import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'

describe('App', () => {
  it('renders the PILOT stub page heading at /pilot', () => {
    render(
      <MemoryRouter initialEntries={['/pilot']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'PILOT' })).toBeInTheDocument()
  })
})
