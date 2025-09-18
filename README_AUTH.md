# 账号系统使用说明

## 功能特性

- ✅ 用户注册和登录
- ✅ 密码加密存储
- ✅ 会话管理
- ✅ 用户界面集成
- ✅ 数据库集成

## 使用方法

### 1. 注册新用户
- 访问 `/auth/signup` 页面
- 填写姓名、邮箱和密码
- 点击注册按钮

### 2. 用户登录
- 访问 `/auth/signin` 页面
- 输入邮箱和密码
- 点击登录按钮

### 3. 用户状态
- 登录后，页面右上角会显示用户菜单
- 可以查看当前登录用户信息
- 可以退出登录

## 技术实现

### 依赖包
- `next-auth`: 认证框架
- `bcryptjs`: 密码加密
- `@next-auth/prisma-adapter`: 数据库适配器
- `zod`: 数据验证

### 数据库模型
- `User`: 用户信息
- `Account`: OAuth 账户（预留）
- `Session`: 用户会话
- `VerificationToken`: 验证令牌（预留）

### API 路由
- `/api/auth/[...nextauth]`: NextAuth 认证路由
- `/api/auth/register`: 用户注册接口

### 页面组件
- `/auth/signin`: 登录页面
- `/auth/signup`: 注册页面
- `UserMenu`: 用户菜单组件
- `AuthProvider`: 认证状态提供者

## 环境变量

在 `.env.local` 文件中配置：

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
DATABASE_URL="file:./dev.db"
```

## 安全注意事项

1. 生产环境中请更改 `NEXTAUTH_SECRET` 为强密码
2. 密码使用 bcrypt 加密存储
3. 支持会话管理和自动过期
4. 所有用户输入都经过验证

## 扩展功能

可以进一步添加：
- 邮箱验证
- 密码重置
- OAuth 登录（Google、GitHub 等）
- 用户角色和权限
- 用户资料管理
