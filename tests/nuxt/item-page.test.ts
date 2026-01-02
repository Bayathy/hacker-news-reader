import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'

import ItemPage from '~/pages/item/[id].vue'

let refreshSpy: ReturnType<typeof vi.fn> | null = null

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

mockNuxtImport('useItemComments', () => {
  return () => {
    const data = ref(null)
    const pending = ref(false)
    const error = ref(null)

    refreshSpy = vi.fn(async () => {
      data.value = {
        item: {
          id: 123,
          title: 'Hello HN',
          url: 'https://example.com',
          by: 'alice',
          time: 1700000000,
          score: 42,
          descendants: 10,
          type: 'story'
        },
        comments: {
          total: 10,
          loaded: 1,
          maxDepth: 4,
          items: [
            {
              id: 1,
              by: 'bob',
              time: 1700000001,
              text: '<p>first</p>',
              kids: []
            }
          ]
        }
      }
      pending.value = false
      error.value = null
    })

    return { data, pending, error, refresh: refreshSpy }
  }
})

describe('pages/item/[id]', () => {
  it('renders title and "読む" CTA', async () => {
    const wrapper = await mountSuspended(ItemPage)
    expect(wrapper.text()).toContain('Hello HN')
    expect(wrapper.text()).toContain('読む')
  })

  it('lazy-loads comments only after expanding', async () => {
    const wrapper = await mountSuspended(ItemPage)

    expect(wrapper.text()).toContain('コメントを表示')
    expect(wrapper.text()).not.toContain('first')

    const buttons = wrapper.findAll('button')
    const showButton = buttons.find(b => b.text().includes('コメントを表示'))
    expect(showButton).toBeTruthy()

    await showButton!.trigger('click')
    await nextTick()

    expect(refreshSpy).not.toBeNull()
    expect(refreshSpy!).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('bob')
    expect(wrapper.text()).toContain('first')

    const hideButton = wrapper.findAll('button').find(b => b.text().includes('コメントを隠す'))
    expect(hideButton).toBeTruthy()

    await hideButton!.trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('first')

    const showAgain = wrapper.findAll('button').find(b => b.text().includes('コメントを表示'))
    expect(showAgain).toBeTruthy()

    await showAgain!.trigger('click')
    await nextTick()
    expect(refreshSpy!).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('first')
  })
})
