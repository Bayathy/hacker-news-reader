import type { ApiError, StoriesResponse, StoriesType, StoryListItem } from '~/types/api'
import { fetchItems, fetchStoryIds } from '../utils/hn'
import { extractDomain } from '../utils/url'

function parseIntParam(
  value: unknown,
  fallback: number,
  opts?: { min?: number, max?: number }
): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)
  const num = Number.isFinite(n) ? n : fallback
  const min = opts?.min ?? -Infinity
  const max = opts?.max ?? Infinity
  return Math.min(max, Math.max(min, num))
}

function isStoriesType(value: unknown): value is StoriesType {
  return value === 'top' || value === 'new' || value === 'best'
}

function toListType(title: string, hnType?: string): StoryListItem['type'] {
  if (hnType === 'job') return 'job'
  if (title.startsWith('Ask HN:')) return 'ask'
  if (title.startsWith('Show HN:')) return 'show'
  return 'story'
}

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)

  const type: StoriesType = isStoriesType(query.type) ? query.type : 'top'
  const page = parseIntParam(query.page, 1, { min: 1 })
  const pageSize = parseIntParam(query.pageSize, 30, { min: 1, max: 50 })

  if (query.type !== undefined && !isStoriesType(query.type)) {
    setResponseStatus(event, 400, 'Bad Request')
    const body: ApiError = {
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid query: type must be one of "top" | "new" | "best"'
    }
    return body
  }

  try {
    const ids = await fetchStoryIds(type)
    const total = ids.length
    const startIndex = (page - 1) * pageSize

    if (startIndex >= total) {
      const empty: StoriesResponse = { type, page, pageSize, total, items: [] }
      return empty
    }

    const concurrency = 10
    const items: StoryListItem[] = []

    let cursor = startIndex
    while (items.length < pageSize && cursor < total) {
      const remaining = pageSize - items.length
      const batchSize = Math.min(Math.max(remaining * 2, concurrency), total - cursor)
      const batchIds = ids.slice(cursor, cursor + batchSize)
      cursor += batchSize

      const fetched = await fetchItems(batchIds, concurrency)
      for (const item of fetched) {
        if (items.length >= pageSize) break
        if (!item || item.deleted || item.dead) continue
        if (!item.id || !item.title || !item.by || !item.time) continue

        const url = item.url ?? null
        items.push({
          id: item.id,
          title: item.title,
          url,
          by: item.by,
          time: item.time,
          score: item.score ?? 0,
          descendants: item.descendants ?? 0,
          type: toListType(item.title, item.type),
          domain: extractDomain(url)
        })
      }
    }

    const body: StoriesResponse = { type, page, pageSize, total, items }
    return body
  } catch (e) {
    setResponseStatus(event, 502, 'Bad Gateway')
    const body: ApiError = {
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      message: e instanceof Error ? e.message : 'Upstream error'
    }
    return body
  }
}, { maxAge: 120 })
