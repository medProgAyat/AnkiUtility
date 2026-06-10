import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import LivePreview from '../LivePreview'

describe('LivePreview', () => {
  beforeEach(()=>{ global.fetch = vi.fn() })
  afterEach(()=> vi.resetAllMocks())

  it('requests preview and renders iframe srcdoc', async () => {
    const tpl = [{ id: 1, name: 'Basic', html: '<div>{{Front}}</div>', css: '' }]
    const html = '<div>Rendered</div>'

    // First call: templates list, Second call: preview result
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => tpl })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ html }) })

    render(<LivePreview />)

    // wait for both fetches (templates + preview)
    await waitFor(()=> expect(global.fetch).toHaveBeenCalledTimes(2))

    const iframe = screen.getByTitle('preview')
    await waitFor(()=> expect(iframe.getAttribute('srcdoc')).toContain('Rendered'))
  })
})
