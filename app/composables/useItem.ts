import type { ItemResponse } from '~/types/api'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export function useItem(id: MaybeRefOrGetter<number | string>) {
  return useFetch<ItemResponse>(() => `/api/item/${toValue(id)}`)
}
