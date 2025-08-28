#!/bin/bash

# エラー時にスクリプトを停止
set -e

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Deno Serverless App with CDK...${NC}"

# 環境変数の確認
if [ -z "$AWS_REGION" ]; then
    export AWS_REGION="ap-northeast-1"
    echo -e "${YELLOW}⚠️  AWS_REGION not set, using default: ap-northeast-1${NC}"
fi

# Dockerデーモンの確認
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Step 1: コードの品質チェック
echo -e "${BLUE}🔍 Step 1: Running code quality checks...${NC}"
pnpm check

# Step 2: CDKでビルド確認
echo -e "${BLUE}🏗️  Step 2: Synthesizing CDK...${NC}"
pnpm cdk synth

# Step 3: CDKデプロイ（自動的にDockerイメージをビルド&デプロイ）
echo -e "${BLUE}📦 Step 3: Deploying with CDK (building Docker image automatically)...${NC}"
echo -e "${YELLOW}⏳ This will take a few minutes as CDK builds the Docker image...${NC}"

pnpm cdk deploy --require-approval never

# デプロイ完了後の情報取得
FUNCTION_URL=$(aws cloudformation describe-stacks --stack-name 'PlaywrightOnLambdaStack' \
    --query 'Stacks[0].Outputs[?OutputKey==`FunctionUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Function URL: ${FUNCTION_URL}${NC}"
echo -e "${GREEN}🧪 Test endpoints:${NC}"
echo -e "   Health Check: ${FUNCTION_URL}health"
echo -e "   Streaming: ${FUNCTION_URL}stream"
echo -e "   Session API: ${FUNCTION_URL}session?sessionId=test123"

# Step 4: ローカルのDockerイメージクリーンアップ
echo -e "${BLUE}🧹 Step 4: Cleaning up local Docker images...${NC}"

# CDKが作成した一時的なイメージを削除
echo "Removing temporary CDK Docker images..."
docker images --filter "dangling=true" -q | xargs -r docker rmi || true

# 古いDenoイメージを削除（タグなしのもの）
docker images | grep "<none>" | grep -E "(deno|lambda)" | awk '{print $3}' | xargs -r docker rmi || true

# 使用されていないボリュームも削除
docker volume prune -f

echo -e "${GREEN}✅ Docker cleanup completed${NC}"

# Step 5: 基本的なヘルスチェック
echo -e "${BLUE}🧪 Step 5: Running basic health check...${NC}"
sleep 5  # Lambda関数の起動を少し待つ

if curl -f -s "${FUNCTION_URL}health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}💡 The function might still be initializing. Try again in a few moments.${NC}"
fi

echo -e "${GREEN}🎉 All done! Your Deno serverless app is running.${NC}"
echo -e "${BLUE}💡 Tip: Run './scripts/test-api.sh' to test all endpoints${NC}"