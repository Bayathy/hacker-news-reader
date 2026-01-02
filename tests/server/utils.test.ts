import { describe, expect, it } from 'vitest'

import { extractDomain } from '../../server/utils/url'
import { mapWithConcurrency } from '../../server/utils/concurrency'

describe('server/utils/url.extractDomain', () => {
  it('returns hostname for valid urls', () => {
    expect(extractDomain('https://example.com/foo')).toBe('example.com')
    expect(extractDomain('http://news.ycombinator.com/item?id=1')).toBe('news.ycombinator.com')
  })

  it('returns null for invalid/empty inputs', () => {
    expect(extractDomain(null)).toBeNull()
    expect(extractDomain(undefined)).toBeNull()
    expect(extractDomain('')).toBeNull()
    expect(extractDomain('not a url')).toBeNull()
  })
})

describe('server/utils/concurrency.mapWithConcurrency', () => {
  it('preserves order while running with concurrency', async () => {
    const input = [1, 2, 3, 4, 5]
    const out = await mapWithConcurrency(input, 2, async (n) => {
      await new Promise(r => setTimeout(r, 1))
      return n * 2
    })
    expect(out).toEqual([2, 4, 6, 8, 10])
  })

  it('throws for invalid concurrency', async () => {
    await expect(mapWithConcurrency([1], 0, async n => n)).rejects.toThrow('Invalid concurrency')
  })
})
