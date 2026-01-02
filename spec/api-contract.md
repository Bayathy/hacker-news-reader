# API契約（Nuxt 4 / Nitro server routes）— 並列開発の合流点

## 目的

フロント（Pages/Components）とサーバ（`server/api`）を **並列に開発**できるよう、HTTP I/F とレスポンス形（DTO）を固定する。

## 前提

- Nuxt 4（Nitro）上の Server Routes として実装する
- 外部データソースは Hacker News Firebase API
- **レスポンスはUI都合に寄せたDTO**とし、HNの生データ（itemの完全形）をそのまま返さない

## 共通仕様

### ベースURL

- 開発/本番ともに同一ホスト配下の相対パスで利用する（例：`/api/stories`）

### 成功時

- `200 OK`
- `Content-Type: application/json`

### エラー時（共通）

- `4xx`（不正なパラメータ） or `5xx`（上流API失敗等）
- JSON で下記形式を返す

```ts
type ApiError = {
  statusCode: number
  statusMessage: string
  message?: string
}
```

## Endpoint: ストーリー一覧

### GET `/api/stories`

#### Query

- `type`: `"top" | "new" | "best"`（default: `"top"`）
- `page`: number（1-based, default: `1`）
- `pageSize`: number（default: `30`）

#### Response（200）

```ts
export type StoriesType = "top" | "new" | "best"

export type StoryListItem = {
  id: number
  title: string
  url: string | null
  by: string
  time: number // unix seconds
  score: number
  descendants: number // comment count（ない場合は0）
  type: "story" | "job" | "ask" | "show"
  domain: string | null // url から抽出、無ければ null
}

export type StoriesResponse = {
  type: StoriesType
  page: number
  pageSize: number
  total: number // ID配列の総数（ページング用）
  items: StoryListItem[]
}
```

#### 備考（実装ガイド）

- 上流: `topstories/newstories/beststories` で ID 配列を取得して `slice`
- `item` 取得は並列するが、**並列数上限**を設ける（例：8〜12）
- dead/deleted 等は `items` から除外してよい（その場合は次のIDも取りに行ってページサイズを満たす）

## Endpoint: 記事詳細（コメントは任意）

### GET `/api/item/:id`

#### Path

- `id`: number

#### Query

- `includeComments`: `"0" | "1"`（default: `"0"`）
- `maxComments`: number（default: `50`）※ `includeComments=1` の時のみ有効
- `maxDepth`: number（default: `4`）※ `includeComments=1` の時のみ有効

#### Response（200）

```ts
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
```

#### 備考（実装ガイド）

- 上流: `item/<id>` を取得
- `includeComments=1` の場合のみ `kids` を再帰取得
- **深さ/件数制限を超えた分は取得しない**（“読む体験”優先で重さ回避）

## クライアント利用（推奨）

- 一覧: `useFetch<StoriesResponse>('/api/stories', { query: { type, page, pageSize } })`
- 詳細: `useFetch<ItemResponse>(`/api/item/${id}`, { query: { includeComments: show ? 1 : 0 } })`

