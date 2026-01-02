# CI（GitHub Actions）方針

## 目的（CIが保証すること）

- 依存関係が再現可能にインストールできる（lockfile からズレない）
- Lint が通る
- 型チェック（`nuxt typecheck`）が通る
- ビルド（`nuxt build`）が通る

## 対象ブランチ / トリガー

- `push`
- `pull_request`
- `workflow_dispatch`（手動実行）

## 実行環境

- OS: `ubuntu-latest`
- Node: `22`
- パッケージマネージャ: `pnpm`（`package.json` の `packageManager` に合わせて major=10）

## 実行コマンド（ローカル再現）

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run build
```

## ワークフロー定義

- `.github/workflows/ci.yml`

