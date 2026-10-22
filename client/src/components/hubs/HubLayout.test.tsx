import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HubLayout from './HubLayout'
import { academicCategories } from '../../data/hubs/academic'

function renderLayout() {
  return render(
    <MemoryRouter>
      <HubLayout
        title="Academic Hub"
        heroTitle="Learn together, pass together"
        heroDescription="Course materials and past questions."
        searchPlaceholder="Search materials…"
        emptyMessage="No academic topics match"
        categories={academicCategories}
      />
    </MemoryRouter>,
  )
}

describe('HubLayout', () => {
  it('renders the hub heading and every category', () => {
    renderLayout()
    expect(screen.getByText('Academic Hub')).toBeInTheDocument()
    expect(screen.getByText('Learn together, pass together')).toBeInTheDocument()
    expect(screen.getByText('Course materials & lecture notes')).toBeInTheDocument()
    expect(screen.getByText('Past questions & exam information')).toBeInTheDocument()
  })

  it('filters the categories as the student types', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.type(screen.getByPlaceholderText('Search materials…'), 'past questions')

    expect(screen.getByText('Past questions & exam information')).toBeInTheDocument()
    expect(screen.queryByText('Course materials & lecture notes')).not.toBeInTheDocument()
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.type(screen.getByPlaceholderText('Search materials…'), 'zzzz')

    expect(screen.getByText('No academic topics match')).toBeInTheDocument()
  })
})
