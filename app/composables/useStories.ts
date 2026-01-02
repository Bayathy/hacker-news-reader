import type { StoriesResponse, StoriesType } from '~/types/api'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

export function useStories(params: {
  type?: MaybeRefOrGetter<StoriesType>
  page?: MaybeRefOrGetter<number>
  pageSize?: MaybeRefOrGetter<number>
}) {
  const type = computed<StoriesType>(() => toValue(params.type) ?? 'top')
  const page = computed<number>(() => toValue(params.page) ?? 1)
  const pageSize = computed<number>(() => toValue(params.pageSize) ?? 30)

  return useFetch<StoriesResponse>('/api/stories', { query: { type, page, pageSize } })
}
