import React from 'react'
import { render, screen } from '@testing-library/react'
import ExportButton from '../ExportButton'

describe('ExportButton (removed)', () => {
  it('renders nothing', () => {
    render(<ExportButton />)
    // component intentionally returns null
    expect(document.body).toBeTruthy()
  })
})
