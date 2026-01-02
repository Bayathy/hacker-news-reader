# Hacker News Reader（記事を読む中心）開発計画（Nuxt 4）

## 目的 / コンセプト

- **記事を読む体験を中心**に据えた Hacker News リーダーサイトを Nuxt 4 で開発する。
- 主導線は「一覧 → 記事詳細 → 外部記事へ」。コメントは補助情報として扱い、**重くならない範囲で段階的に表示**する。

## 前提（技術スタック / 制約）

- Nuxt 4 / Vue 3 / TypeScript
- データソースは Hacker News Firebase API（ID一覧 → item個別取得が基本）
- N+1 を吸収するため、**Nuxt（Nitro）の Server Routes（`server/api`）で集約**し、キャッシュ/並列制御/DTO整形を行う

## MVP（最小で「読める」状態）

### 画面

- `/`：ストーリー一覧
  - タブ：Top / New / Best
  - ページング：30件/ページ、前へ/次へ
  - 表示：タイトル、スコア、作者、相対時刻、コメント数、ドメイン
  - CTA：**読む（外部URLへ）**
- `/item/[id]`：記事詳細
  - CTA：**読む（外部URLへ）**
  - URLがない場合（Ask/Show等）：HN内で読む（詳細に留まる）導線
  - コメント：折りたたみ（デフォルト非表示）、開いたら遅延取得

### 非機能（MVPで必須）

- ローディング / エラー / 空状態
- サーバ側短期キャッシュ（例：60〜300秒）
- 一覧 item 取得の並列数制限（無制限にしない）
- dead/deleted など「存在するが表示しづらい」ケースの扱い（一覧で除外 or 表示を弱める）

## アーキテクチャ（Nuxt 4 の載せ方）

### Pages（UIルーティング）

- `app/pages/index.vue`：一覧（タブ + ページング）
- `app/pages/item/[id].vue`：詳細（外部記事CTA + コメント折りたたみ）
- （任意）`app/pages/user/[id].vue`：ユーザ（後回し可）

### Server API（集約 / キャッシュ / 並列制御）

- `server/api/stories.get.ts`：一覧データ（ID配列 → slice → item取得 → DTO整形）
- `server/api/item/[id].get.ts`：詳細データ（item取得 + optional コメント取得）

> API 契約は `spec/api-contract.md` を参照。

### ルートルール / 生成（`routeRules`）の扱い（重要）

このリポジトリは `nuxt.config.ts` に `routeRules` があり、`/` が `prerender: true` になっている。

- HN は更新頻度が高いため、**一覧ページの完全プリレンダーは内容が古くなりやすい**。
- 方針候補:
  - **SSR + サーバ側キャッシュ**（推奨）
  - もしくは `routeRules` を `swr` / `isr` 相当の戦略に寄せる（デプロイ環境に依存）

※ MVP 段階では「SSR + `/api/*` の短期キャッシュ」を前提に設計する。

### Composables（取得の統一）

- `app/composables/useStories.ts`：`/api/stories` を呼び出す
- `app/composables/useItem.ts`：`/api/item/:id` を呼び出す

### Components（責務分離の例）

- `StoryCard`：一覧の1件表示（CTA含む）
- `StoryList`：一覧
- `Tabs`：Top/New/Best
- `Pagination`：前へ/次へ
- `CommentThread`：コメント表示（折りたたみ・再帰レンダリング）

## 並列開発のための作業レーン（役割分担）

### レーンA：Server/API（`server/api`）

- HN Firebase API クライアント（fetch, エラーハンドリング）
- `/api/stories` 実装（並列取得 + DTO整形 + キャッシュ）
- `/api/item/:id` 実装（コメントはオプション、深さ/件数制限）
- 共通のエラー整形（フロントが扱いやすい形）

**完了条件**
- `spec/api-contract.md` のI/F通りにレスポンスを返せる
- 失敗時に一貫したステータス/メッセージを返す

### レーンB：Frontend（Pages/Components）

- `/` 一覧のUI（タブ・ページング・CTA）
- `/item/[id]` 詳細UI（CTA・メタ情報・コメント折りたたみ）
- ローディング/エラー/空状態

**完了条件**
- APIが未完成でもモック/スタブでUIが組める
- APIが揃い次第、実データで動作

### レーンC：共通（型・ユーティリティ・見た目の一貫性）

- DTO型定義（`~/types` などに集約）
- 付随ユーティリティ（相対時刻、ドメイン抽出、HTMLサニタイズ方針）
- Skeleton/エラー表示コンポーネントの共通化

**完了条件**
- APIとUIが同じ型定義を共有でき、ズレが起きにくい

### レーンD：品質（最低限のガードレール）

- lint/typecheck の維持
- 重要ケースの確認観点の整備（dead/deleted、urlなし、kidsなし等）
- （可能なら）server/api の軽いテスト

**完了条件**
- CIが落ちない状態を維持

## 合流ポイント（依存関係）

- 最初に合意するのは **API契約（I/F）** のみ（`spec/api-contract.md`）。
- 合流1：`/api/stories` 完成 → 一覧が実データ接続
- 合流2：`/api/item/:id` 完成 → 詳細/コメントが実データ接続

## マイルストーン

- **M1**：Top一覧 → 詳細 → 外部記事へ「読む」導線（コメントなしでもOK）
- **M2**：Top/New/Best + ページング
- **M3**：コメント折りたたみ（遅延ロード + 制限）+ キャッシュ最適化
- **M4**：体験改善（空状態/例外ケース/軽いデザイン調整）

## スコープ外（当面）

- 記事本文の抽出・全文リーダー（HN API では提供されないため、別途スクレイピング等が必要）
- 高度な検索（必要なら Algolia HN Search API を追加で検討）

