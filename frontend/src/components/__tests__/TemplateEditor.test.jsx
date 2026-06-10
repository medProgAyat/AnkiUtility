import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateEditor from '../TemplateEditor'

describe('TemplateEditor', () => {
  beforeEach(()=>{ global.fetch = vi.fn(); vi.spyOn(window, 'dispatchEvent') })
  afterEach(()=> { vi.resetAllMocks(); window.dispatchEvent.mockRestore && window.dispatchEvent.mockRestore() })

  it('loads templates and saves changes', async () => {
    const templates = [{ id: 1, name: 'Basic', html: '<div>{{Front}}</div>', css: '' }]
    global.fetch.mockResolvedValueOnce({ ok: true, json: async ()=> templates })

    render(<TemplateEditor />)
    // wait for input to be populated
    const nameInput = await waitFor(()=> screen.getByDisplayValue('Basic'))

    // change name
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'NewName')

    // mock save response
    global.fetch.mockResolvedValueOnce({ ok: true, json: async ()=> ({ id: 1 }) })

    const saveBtn = screen.getByText('Save Template')
    await userEvent.click(saveBtn)

    await waitFor(()=> expect(global.fetch).toHaveBeenCalled())
    // saved should dispatch an app:toast event
    expect(window.dispatchEvent).toHaveBeenCalled()
    const ev = window.dispatchEvent.mock.calls.find(c=> c[0] && c[0].type === 'app:toast')
    expect(ev).toBeTruthy()
  })
})
