import { describe, it, expect } from 'vitest'
import CSVImporter from '../CSVImporter'

describe('smoke', () => {
  it('imports component', () => {
    expect(typeof CSVImporter).toBe('function')
  })
})
