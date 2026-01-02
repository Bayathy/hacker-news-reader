import { mapWithConcurrency } from './concurrency'

type HnItem = {
  id: number
  deleted?: boolean
  dead?: boolean
  type?: string
  by?: string
  time?: number
  text?: string
  url?: string
  title?: string
  score?: number
  descendants?: number
  kids?: number[]
}

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

export type HnStoriesType = 'top' | 'new' | 'best'

function storiesPath(type: HnStoriesType) {
  switch (type) {
    case 'top':
      return '/topstories.json'
    case 'new':
      return '/newstories.json'
    case 'best':
      return '/beststories.json'
  }
}

export async function fetchStoryIds(type: HnStoriesType): Promise<number[]> {
  const ids = await $fetch<number[]>(`${HN_BASE}${storiesPath(type)}`)
  return Array.isArray(ids) ? ids : []
}

export async function fetchItem(id: number): Promise<HnItem | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  const item = await $fetch<HnItem | null>(`${HN_BASE}/item/${id}.json`)
  if (!item || typeof item !== 'object') return null
  return item
}

export async function fetchItems(ids: readonly number[], concurrency = 10): Promise<(HnItem | null)[]> {
  return await mapWithConcurrency(ids, concurrency, async (id) => {
    try {
      return await fetchItem(id)
    } catch {
      return null
    }
  })
}
