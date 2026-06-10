import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardTable from '../CardTable'

describe('CardTable', () => {
  beforeEach(()=>{
    global.fetch = vi.fn()
    vi.spyOn(window, 'dispatchEvent')
  })
  afterEach(()=> { vi.resetAllMocks(); window.dispatchEvent.mockRestore && window.dispatchEvent.mockRestore() })

  it('renders cards from API and saves edits', async () => {
    const cards = [{ id: 1, fields: { Front: 'Q1' }, tags: 't', deck_id: null, template_id: null }]
    const decks = [{ id: 10, name: 'Default' }]
    const templates = [{ id: 20, name: 'Basic', deck_id: 10 }]

    // Mock the three initial fetches: cards, decks, templates
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => cards })
      .mockResolvedValueOnce({ ok: true, json: async () => decks })
      .mockResolvedValueOnce({ ok: true, json: async () => templates })

    render(<CardTable />)

    // wait until card ID is rendered
    await waitFor(()=> expect(screen.getByText('1')).toBeInTheDocument())

    // ensure fields are shown
    const pre = screen.getByText(/Q1/)
    expect(pre).toBeInTheDocument()

    // mock save (PUT)
    global.fetch.mockResolvedValueOnce({ ok: true, json: async() => ({}) })

    // enter edit mode for first card, then click Save
    const editBtn = screen.getByText(/Edit/i)
    await userEvent.click(editBtn)
    const saveBtn = screen.getByText('Save')
    await userEvent.click(saveBtn)

    await waitFor(()=> expect(global.fetch).toHaveBeenCalled())
    // initial 3 fetches + 1 save = 4
    expect(global.fetch).toHaveBeenCalledTimes(4)
    // save should dispatch a toast
    expect(window.dispatchEvent).toHaveBeenCalled()
    const ev = window.dispatchEvent.mock.calls.find(c=> c[0] && c[0].type === 'app:toast')
    expect(ev).toBeTruthy()
  })
})
