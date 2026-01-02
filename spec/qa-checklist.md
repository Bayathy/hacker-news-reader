# QA / 重要ケースのチェックリスト（最低限）

目的: 壊れやすいケース（HN特有の欠損/例外）を見落とさないための最小チェック。

## 一覧（`/` / `GET /api/stories`）

- **type**
  - `top/new/best` が動く
  - 不正な `type` は `400` + `ApiError` 形式
- **ページング**
  - `page=1` で表示される
  - 範囲外ページ（startIndex >= total）で `items: []` が返る
- **欠損/除外**
  - `dead/deleted` なitemが混ざっても壊れない（除外して埋める）
  - `url` が無い（Ask/Show）場合でも表示は成立する（domainは `null`）

## 詳細（`/item/[id]` / `GET /api/item/:id`）

- **id**
  - 不正なidは `400` + `ApiError`
  - 存在しない/`dead/deleted` は `404` + `ApiError`
- **url**
  - `url` がある: Primary CTA「読む」が出る
  - `url` がない: フォールバックの文言/導線が出る

## コメント（`GET /api/item/:id?includeComments=1`）

- **遅延ロード**
  - デフォルトではコメント取得しない（折りたたみ）
  - 開いたときだけ取得する
- **制限**
  - `maxComments` を超えて返さない
  - `maxDepth` を超えて再帰取得しない
  - `dead/deleted` コメントは除外される

