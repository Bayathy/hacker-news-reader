export type ApiError = {
  statusCode: number
  statusMessage: string
  message?: string
}

export type StoriesType = 'top' | 'new' | 'best'

export type StoryListItem = {
  id: number
  title: string
  url: string | null
  by: string
  time: number // unix seconds
  score: number
  descendants: number // comment count（ない場合は0）
  type: 'story' | 'job' | 'ask' | 'show'
  domain: string | null // url から抽出、無ければ null
}

export type StoriesResponse = {
  type: StoriesType
  page: number
  pageSize: number
  total: number // ID配列の総数（ページング用）
  items: StoryListItem[]
}

export type CommentNode = {
  id: number
  by: string | null
  time: number
  text: string | null // HNのHTML文字列（UI側でv-html等。サニタイズ方針は別途）
  kids: CommentNode[]
}

export type ItemResponse = {
  item: {
    id: number
    title: string
    url: string | null
    by: string
    time: number
    score: number
    descendants: number
    type: string
  }
  comments?: {
    total: number // descendants 等から推定してもよい
    loaded: number // 実際に返却した comment node 数
    maxDepth: number
    items: CommentNode[]
  }
}

