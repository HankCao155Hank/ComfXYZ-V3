#!/bin/bash

# 部署脚本 - 推送数据库 schema 并构建应用
echo "🚀 开始部署..."

# 推送数据库 schema
echo "📊 推送数据库 schema..."
npx prisma db push

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 构建 Next.js 应用
echo "🏗️ 构建 Next.js 应用..."
next build

echo "✅ 部署完成！"
