import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'

import IndexPage from '~/pages/index.vue'

mockNuxtImport('useStories', () => {
  return () => {
    return {
      data: ref({
        type: 'top',
        page: 1,
        pageSize: 30,
        total: 1,
        items: [
          {
            id: 123,
            title: 'Hello HN',
            url: 'https://example.com',
            by: 'alice',
            time: 1700000000,
            score: 42,
            descendants: 10,
            type: 'story',
            domain: 'example.com'
          }
        ]
      }),
      pending: ref(false),
      error: ref(null)
    }
  }
})

describe('pages/index', () => {
  it('renders story list and "読む" CTA', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('Hacker News')
    expect(wrapper.text()).toContain('Hello HN')
    expect(wrapper.text()).toContain('読む')
  })
})
