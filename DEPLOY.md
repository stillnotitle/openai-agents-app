# デプロイ設定

Next.jsアプリケーションをCloudflare Workersにデプロイするための設定ファイルです。
このファイルは、wrangler.tomlの設定を説明しています。

## Cloudflare Workersについて

Cloudflare Workersは、Cloudflareのエッジネットワーク上で動作するサーバーレスプラットフォームです。
Next.jsアプリケーションをCloudflare Workersにデプロイすることで、以下のメリットがあります：

- グローバルなエッジネットワークによる高速な応答時間
- サーバーレスアーキテクチャによる自動スケーリング
- 組み込みのセキュリティ機能
- D1データベースとの統合

## デプロイ手順

1. Cloudflareアカウントを作成し、Workersを有効化します
2. Cloudflare Workersの認証情報を設定します
   ```bash
   npx wrangler login
   ```
3. アプリケーションをビルドします
   ```bash
   pnpm build:worker
   ```
4. アプリケーションをデプロイします
   ```bash
   npx wrangler deploy
   ```

## 環境変数の設定

デプロイ後、以下の環境変数を設定する必要があります：

- `OPENAI_API_KEY`: OpenAI APIキー（オプション、ユーザーが提供するため）

環境変数は以下のコマンドで設定できます：

```bash
npx wrangler secret put OPENAI_API_KEY
```

## D1データベースの設定

このアプリケーションはCloudflare D1データベースを使用しています。
デプロイ前に、D1データベースを作成し、マイグレーションを適用する必要があります：

1. D1データベースを作成します
   ```bash
   npx wrangler d1 create openai-agents-app
   ```

2. wrangler.tomlファイルを更新します（データベースIDを設定）

3. マイグレーションを適用します
   ```bash
   npx wrangler d1 migrations apply openai-agents-app
   ```

## wrangler.toml設定の説明

```toml
name = "openai-agents-app"
main = "worker/index.js"
compatibility_date = "2023-12-01"

[site]
bucket = ".open-next/assets"

[build]
command = "pnpm build:worker"

[[d1_databases]]
binding = "DB"
database_name = "openai-agents-app"
database_id = "your-database-id-here"
```

- `name`: Workerの名前
- `main`: エントリーポイントのJSファイル
- `compatibility_date`: Workersランタイムの互換性日付
- `site.bucket`: 静的アセットのパス
- `build.command`: ビルドコマンド
- `d1_databases`: D1データベースの設定

## カスタムドメインの設定

Cloudflare Dashboardから、カスタムドメインをWorkerに割り当てることができます：

1. Cloudflare Dashboardにログインします
2. Workersセクションに移動します
3. デプロイしたWorkerを選択します
4. 「トリガー」タブをクリックします
5. 「カスタムドメイン」セクションで、ドメインを追加します
