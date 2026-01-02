import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'

import ItemPage from '~/pages/item/[id].vue'

mockNuxtImport('useRoute', () => {
  return () => ({ params: { id: '123' } })
})

mockNuxtImport('useItem', () => {
  return () => {
    return {
      data: ref({
        item: {
          id: 123,
          title: 'Hello HN',
          url: 'https://example.com',
          by: 'alice',
          time: 1700000000,
          score: 42,
          descendants: 10,
          type: 'story'
        }
      }),
      pending: ref(false),
      error: ref(null)
    }
  }
})

describe('pages/item/[id]', () => {
  it('renders title and "読む" CTA', async () => {
    const wrapper = await mountSuspended(ItemPage)
    expect(wrapper.text()).toContain('Hello HN')
    expect(wrapper.text()).toContain('読む')
  })
})
