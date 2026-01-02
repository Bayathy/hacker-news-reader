import type { ApiError, CommentNode, ItemResponse } from '~/types/api'
import { fetchItem, fetchItems } from '../../utils/hn'

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

export default defineCachedEventHandler(async (event) => {
  const rawId = event.context.params?.id
  const id = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number(rawId)

  if (!Number.isFinite(id) || id <= 0) {
    setResponseStatus(event, 400, 'Bad Request')
    const body: ApiError = {
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid path param: id must be a positive number'
    }
    return body
  }

  let item: Awaited<ReturnType<typeof fetchItem>>
  try {
    item = await fetchItem(id)
  } catch (e) {
    setResponseStatus(event, 502, 'Bad Gateway')
    const body: ApiError = {
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      message: e instanceof Error ? e.message : 'Upstream error'
    }
    return body
  }

  if (!item || item.deleted || item.dead) {
    setResponseStatus(event, 404, 'Not Found')
    const body: ApiError = {
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Item not found'
    }
    return body
  }

  const response: ItemResponse = {
    item: {
      id: item.id,
      title: item.title ?? '',
      url: item.url ?? null,
      by: item.by ?? '',
      time: item.time ?? 0,
      score: item.score ?? 0,
      descendants: item.descendants ?? 0,
      type: item.type ?? 'story'
    }
  }

  const query = getQuery(event)
  const includeComments = query.includeComments === '1'
  if (!includeComments) return response

  const maxComments = parseIntParam(query.maxComments, 50, { min: 0, max: 200 })
  const maxDepth = parseIntParam(query.maxDepth, 4, { min: 1, max: 10 })
  const concurrency = 10

  let loaded = 0

  const buildNodes = async (ids: number[] | undefined, depth: number): Promise<CommentNode[]> => {
    if (!ids || ids.length === 0) return []
    if (depth > maxDepth) return []
    if (loaded >= maxComments) return []

    const fetched = await fetchItems(ids, concurrency)
    const nodes: CommentNode[] = []

    for (const c of fetched) {
      if (loaded >= maxComments) break
      if (!c || c.deleted || c.dead) continue
      if (c.type !== 'comment') continue
      if (!c.id || !c.time) continue

      loaded++
      const kids = await buildNodes(c.kids, depth + 1)
      nodes.push({
        id: c.id,
        by: c.by ?? null,
        time: c.time,
        text: c.text ?? null,
        kids
      })
    }

    return nodes
  }

  const commentItems = await buildNodes(item.kids, 1)
  response.comments = {
    total: item.descendants ?? 0,
    loaded,
    maxDepth,
    items: commentItems
  }

  return response
}, {
  maxAge: 120,
  getKey: (event) => {
    const rawId = event.context.params?.id
    const id = typeof rawId === 'string' ? rawId : String(rawId ?? '')

    const query = getQuery(event)
    const includeComments = query.includeComments === '1'
    if (!includeComments) return `item:${id}`

    const maxComments = parseIntParam(query.maxComments, 50, { min: 0, max: 200 })
    const maxDepth = parseIntParam(query.maxDepth, 4, { min: 1, max: 10 })
    return `item:${id}:comments:${maxComments}:${maxDepth}`
  }
})
