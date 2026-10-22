import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import DiscoverPanel from './DiscoverPanel'

function renderPanel(props: Partial<React.ComponentProps<typeof DiscoverPanel>> = {}) {
  const onSearchChange = vi.fn()
  render(
    <MemoryRouter>
      <DiscoverPanel
        search=""
        onSearchChange={onSearchChange}
        variant="desktop"
        {...props}
      />
    </MemoryRouter>,
  )
  return { onSearchChange }
}

describe('DiscoverPanel', () => {
  it('lists every hub when the search box is empty', () => {
    renderPanel()
    expect(screen.getByText('Campus News & Announcements')).toBeInTheDocument()
    expect(screen.getByText('Know Your School')).toBeInTheDocument()
    expect(screen.getByText('Final Year Students Hub')).toBeInTheDocument()
  })

  it('filters the hubs by title, description and keywords', () => {
    renderPanel({ search: 'siwes' })
    expect(screen.getByText('SIWES / IT Hub')).toBeInTheDocument()
    expect(screen.queryByText('Campus News & Announcements')).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', () => {
    renderPanel({ search: 'zzzz-no-hub' })
    expect(screen.getByText(/No hubs match/)).toBeInTheDocument()
  })

  it('reports typing back to the parent', async () => {
    const user = userEvent.setup()

    // A stateful wrapper so the controlled input behaves like it does in the app.
    function Wrapper() {
      const [search, setSearch] = useState('')
      return (
        <MemoryRouter>
          <DiscoverPanel search={search} onSearchChange={setSearch} variant="desktop" />
        </MemoryRouter>
      )
    }

    render(<Wrapper />)
    await user.type(screen.getByPlaceholderText('Search contents, hubs, courses...'), 'jamb')

    // The list is narrowed to the admission hub once the query is applied.
    expect(screen.getByText('Aspirant / Admission Hub')).toBeInTheDocument()
    expect(screen.queryByText('Know Your School')).not.toBeInTheDocument()
  })

  it('renders the compact mobile layout', () => {
    renderPanel({ variant: 'mobile' })
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search contents, hubs, courses...')).toBeInTheDocument()
  })
})
