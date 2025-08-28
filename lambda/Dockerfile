# Lambda Web Adapter用のマルチステージビルド
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS aws-lambda-adapter
FROM denoland/deno:bin-2.4.5 AS deno_bin
FROM debian:bookworm-20250811-slim AS deno_runtime

# Lambda Web Adapterのコピー
COPY --from=aws-lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# Denoバイナリのコピー
COPY --from=deno_bin /deno /usr/local/bin/deno

# Google Chromeをインストール
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 環境変数設定
ENV PORT=8000
ENV DENO_DIR=/var/deno_dir
ENV AWS_LWA_INVOKE_MODE=RESPONSE_STREAM

# ポート公開
EXPOSE 8000

# Denoキャッシュディレクトリの作成
RUN mkdir -p /var/deno_dir

# 作業ディレクトリの設定
WORKDIR /var/task

# アプリケーションコードのコピー
COPY lambda/main.ts .
COPY lambda/mcp.ts .

# 依存関係のキャッシュ（コールドスタート時間短縮）
RUN timeout 10s deno run -A main.ts || [ $? -eq 124 ] || exit 1

# 実行コマンド
CMD ["deno", "run", "-A", "main.ts"]