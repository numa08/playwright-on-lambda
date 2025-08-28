# Lambda Web Adapter用のマルチステージビルド
FROM public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 AS aws-lambda-adapter
FROM denoland/deno:bin-2.4.5 AS deno_bin
FROM debian:bookworm-20250811-slim AS deno_runtime

# Lambda Web Adapterのコピー
COPY --from=aws-lambda-adapter /lambda-adapter /opt/extensions/lambda-adapter

# Denoバイナリのコピー
COPY --from=deno_bin /deno /usr/local/bin/deno

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
COPY main.ts .

# 依存関係のキャッシュ（コールドスタート時間短縮）
RUN timeout 10s deno run -A main.ts || [ $? -eq 124 ] || exit 1

# 実行コマンド
CMD ["deno", "run", "-A", "main.ts"]