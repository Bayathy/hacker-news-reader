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

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const STORY_IDS_TTL_MS = 30_000
const ITEM_TTL_MS = 60_000
const ITEM_CACHE_MAX = 2_000

const storyIdsCache = new Map<HnStoriesType, CacheEntry<number[]>>()
const itemCache = new Map<number, CacheEntry<HnItem | null>>()

function getFromCache<K, V>(cache: Map<K, CacheEntry<V>>, key: K): V | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

function setCache<K, V>(cache: Map<K, CacheEntry<V>>, key: K, value: V, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function pruneItemCache() {
  if (itemCache.size <= ITEM_CACHE_MAX) return
  const over = itemCache.size - ITEM_CACHE_MAX
  let i = 0
  for (const key of itemCache.keys()) {
    itemCache.delete(key)
    i++
    if (i >= over) return
  }
}

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
  const cached = getFromCache(storyIdsCache, type)
  if (cached) return cached

  const ids = await $fetch<number[]>(`${HN_BASE}${storiesPath(type)}`)
  const normalized = Array.isArray(ids) ? ids : []
  setCache(storyIdsCache, type, normalized, STORY_IDS_TTL_MS)
  return normalized
}

export async function fetchItem(id: number): Promise<HnItem | null> {
  if (!Number.isFinite(id) || id <= 0) return null

  const cached = getFromCache(itemCache, id)
  if (cached !== undefined) return cached

  const item = await $fetch<HnItem | null>(`${HN_BASE}/item/${id}.json`)
  const normalized = !item || typeof item !== 'object' ? null : item

  setCache(itemCache, id, normalized, ITEM_TTL_MS)
  pruneItemCache()

  return normalized
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
