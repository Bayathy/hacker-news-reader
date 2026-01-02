# Hacker News Reader（Nuxt 4）

記事を読む体験を中心にした Hacker News リーダーです。

## 開発環境

- Node: `22`
- Package manager: `pnpm`（`package.json` の `packageManager` に従う）

## セットアップ

```bash
pnpm install --frozen-lockfile
```

## ローカル開発

```bash
pnpm dev
```

起動後は `http://localhost:3000` を開きます。

## テスト

```bash
pnpm test
```

## CIのローカル再現

CIは下記を実行します（詳細は `spec/ci.md` 参照）:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run build
```
