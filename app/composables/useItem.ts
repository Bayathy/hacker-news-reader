import type { ItemResponse } from '~/types/api'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

export function useItem(id: MaybeRefOrGetter<number | string>) {
  return useFetch<ItemResponse>(() => `/api/item/${toValue(id)}`)
}

type UseItemCommentsOptions = {
  maxComments?: number
  maxDepth?: number
}

/**
 * Lazy-load comments for an item.
 *
 * Note: This is intentionally `immediate: false` so the caller can trigger
 * fetching only after the user expands the comments section.
 */
export function useItemComments(
  id: MaybeRefOrGetter<number | string>,
  options?: UseItemCommentsOptions
) {
  const maxComments = options?.maxComments ?? 50
  const maxDepth = options?.maxDepth ?? 4

  const query = computed(() => ({
    includeComments: '1',
    maxComments,
    maxDepth
  }))

  return useFetch<ItemResponse>(() => `/api/item/${toValue(id)}`, {
    immediate: false,
    watch: false,
    query
  })
}
