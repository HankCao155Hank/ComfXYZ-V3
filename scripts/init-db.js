#!/usr/bin/env node

// 数据库初始化脚本
const { execSync } = require('child_process');

console.log('🚀 初始化数据库...');

try {
  // 检查 DATABASE_URL 是否存在且有效
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 环境变量未设置');
    process.exit(1);
  }
  
  if (databaseUrl.includes('db.prisma.io')) {
    console.error('❌ DATABASE_URL 指向了无效的示例地址 (db.prisma.io)');
    console.error('请设置正确的 PostgreSQL 数据库连接字符串');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL 检查通过');
  
  // 推送数据库 schema
  console.log('📊 推送数据库 schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // 生成 Prisma 客户端
  console.log('🔧 生成 Prisma 客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ 数据库初始化完成！');
  
} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message);
  process.exit(1);
}
