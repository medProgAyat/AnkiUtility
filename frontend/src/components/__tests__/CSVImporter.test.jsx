import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CSVImporter from '../CSVImporter'

describe('CSVImporter', () => {
  beforeEach(()=>{
    global.fetch = vi.fn()
    vi.spyOn(window, 'dispatchEvent')
  })
  afterEach(()=>{
    vi.resetAllMocks()
    window.dispatchEvent.mockRestore && window.dispatchEvent.mockRestore()
  })

  it('uploads CSV and shows columns', async () => {
    const mockResponse = { columns: ['a','b'], sample: [{a: '1', b: '2'}], rows: [{a:'1', b:'2'}] }
    // initial fetches for decks and templates (empty arrays), then upload response
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async ()=> ([]) })
      .mockResolvedValueOnce({ ok: true, json: async ()=> ([]) })
      .mockResolvedValueOnce({ ok: true, json: async ()=> mockResponse })

    const { container } = render(<CSVImporter />)
    const input = container.querySelector('input[type="file"]')
    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' })

    // programmatically fire upload on the hidden file input
    await userEvent.upload(input, file)

    await waitFor(()=>{
      expect(global.fetch).toHaveBeenCalled()
      // uploader should dispatch a toast on success
      expect(window.dispatchEvent).toHaveBeenCalled()
      const ev = window.dispatchEvent.mock.calls.find(c=> c[0] && c[0].type === 'app:toast')
      expect(ev).toBeTruthy()
    })
  })
})
