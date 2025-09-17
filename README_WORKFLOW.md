# ComfyUI 工作流管理系统

基于 test-comfy.ts 框架开发的完整工作流管理网页应用，支持工作流的创建、存储、管理和批量执行，生成的图片自动保存到 Vercel Blob 存储并在界面上展示。

## 主要功能

### 🎯 工作流管理
- **工作流类型选择**: 支持多种预定义的ComfyUI工作流类型（基于[Infini AI ComfyStack平台](https://docs.infini-ai.com/comfy-stack/tutorial-comfyui.html)）
- **创建工作流**: 配置提示词、负向提示词、图像尺寸、采样步数等参数
- **自定义工作流ID**: 支持使用自定义的ComfyStack工作流ID
- **编辑工作流**: 修改现有工作流的所有参数
- **删除工作流**: 删除不需要的工作流（会同时删除相关生成记录）
- **工作流列表**: 查看所有工作流及其最近的生成状态

### 🚀 批量执行
- **单个执行**: 执行单个工作流生成图像
- **批量执行**: 选择多个工作流同时执行
- **XY轴批量生成**: 设置X轴和Y轴参数，生成所有参数组合的对比网格
- **自定义参数**: 批量执行时可以覆盖统一参数
- **任务队列**: 自动管理生成任务，避免API限制

### 🖼️ 结果展示
- **实时状态**: 实时显示生成任务的状态（等待中、运行中、已完成、失败）
- **图片预览**: 完成的图片支持预览和下载
- **参数记录**: 记录每次生成使用的实际参数
- **错误处理**: 显示失败任务的错误信息

### 💾 数据存储
- **数据库存储**: 使用 PostgreSQL 存储工作流配置和生成记录
- **Blob 存储**: 生成的图片自动上传到 Vercel Blob 存储
- **持久化**: 所有数据持久化存储，重启后不会丢失

## 技术架构

### 前端技术栈
- **Next.js 15**: React 全栈框架
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 现代化 CSS 框架
- **Radix UI**: 无障碍的 UI 组件库
- **Lucide React**: 精美的图标库

### 后端技术栈
- **Next.js API Routes**: 服务端 API
- **Prisma**: 现代化 ORM
- **PostgreSQL**: 关系型数据库
- **Vercel Blob**: 文件存储服务

### 外部服务
- **Infini AI ComfyStack**: ComfyUI 托管工作流平台（[文档](https://docs.infini-ai.com/comfy-stack/tutorial-comfyui.html)）
- **Vercel**: 部署和托管平台

## ComfyStack 集成说明

本系统基于 [Infini AI ComfyStack 平台](https://docs.infini-ai.com/comfy-stack/tutorial-comfyui.html) 的托管工作流服务：

### 工作流架构
1. **托管工作流**: 工作流需要先在 ComfyStack 平台上创建和发布
2. **workflow_id**: 每个托管工作流都有唯一的 `workflow_id`（如 `wf-dbsdzzra6cwtpo33`）
3. **参数覆盖**: 通过 `prompt` 对象覆盖工作流中特定节点的参数值
4. **入参范围**: 平台会为每个工作流生成可用参数的范围和类型

### API 调用流程
1. 使用 `workflow_id` 和 `prompt` 参数提交生成任务
2. 获取 `prompt_id` 作为任务标识
3. 轮询任务状态直到完成
4. 下载生成的图片并上传到 Vercel Blob

### 扩展新工作流类型
要添加新的工作流类型，需要：
1. 在 ComfyStack 平台上创建并发布工作流
2. 在 `lib/comfy.ts` 中的 `WORKFLOW_CONFIGS` 添加配置
3. 在 `app/api/workflow-types/route.ts` 中添加类型定义
4. 实现对应的 `buildPrompt` 函数来构建参数映射

## 安装和运行

### 1. 环境准备
```bash
# 克隆项目
git clone <项目地址>
cd comfxyz-v3_副本

# 安装依赖
npm install
# 或者使用 pnpm
pnpm install
```

### 2. 环境配置
创建 `.env.local` 文件并配置以下变量：
```bash
# ComfyUI API 密钥
INFINI_AI_API_KEY=your_infini_ai_api_key_here

# 数据库连接（开发环境可使用 SQLite）
DATABASE_URL="file:./dev.db"

# Vercel Blob 存储（在 Vercel 上部署时自动配置）
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### 3. 数据库设置
```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# （可选）查看数据库
npx prisma studio
```

### 4. 启动开发服务器
```bash
npm run dev
# 或者
pnpm dev
```

访问 http://localhost:3000 即可使用应用。

## 使用说明

### 创建工作流
1. 点击"新建工作流"按钮
2. 填写工作流名称和描述
3. 配置正向提示词（必填）
4. 可选配置负向提示词
5. 设置图像参数（宽度、高度、采样步数、CFG Scale、种子值）
6. 点击"保存工作流"

### 执行工作流
1. 在工作流列表中找到要执行的工作流
2. 点击"执行"按钮启动单个任务
3. 或者选择多个工作流，点击"批量执行"
4. 切换到"生成结果"标签页查看进度

### 查看结果
1. 在"生成结果"页面可以看到所有生成记录
2. 完成的图片会显示缩略图
3. 点击图片可以预览大图
4. 点击下载按钮可以保存图片到本地

## API 接口

### 工作流管理
- `GET /api/workflows` - 获取所有工作流
- `POST /api/workflows` - 创建新工作流
- `GET /api/workflows/[id]` - 获取单个工作流详情
- `PUT /api/workflows/[id]` - 更新工作流
- `DELETE /api/workflows/[id]` - 删除工作流

### 生成任务
- `POST /api/generate` - 执行单个工作流
- `POST /api/generate/batch` - 批量执行工作流
- `GET /api/generations` - 获取生成记录

### 工作流类型
- `GET /api/workflow-types` - 获取所有可用的工作流类型

### XY轴批量生成
- `POST /api/generate/xy-batch` - XY轴参数组合批量生成

### 数据导出
- `POST /api/export/xy-batch` - 导出XY轴批量生成结果为Excel/CSV文件

## 数据模型

### Workflow（工作流）
```prisma
model Workflow {
  id          String   @id @default(cuid())
  name        String   // 工作流名称
  description String?  // 描述
  
  // ComfyUI工作流配置
  workflowType String  @default("qwen-image-default") // 工作流类型
  comfyWorkflowId String? // 自定义ComfyStack工作流ID
  
  // 生成参数
  prompt      String   // 正向提示词
  negativePrompt String? // 负向提示词
  width       Int      @default(1328) // 图像宽度
  height      Int      @default(1328) // 图像高度
  steps       Int      @default(20)   // 采样步数
  cfg         Float    @default(2.5)  // CFG Scale
  seed        Int?     // 种子值
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  generations Generation[] // 关联的生成记录
}
```

### Generation（生成记录）
```prisma
model Generation {
  id         String   @id @default(cuid())
  workflowId String   // 关联的工作流ID
  status     String   // 状态：pending, running, completed, failed
  blobUrl    String?  // Vercel Blob URL
  errorMsg   String?  // 错误信息
  startedAt  DateTime @default(now())
  completedAt DateTime? // 完成时间
  
  // 实际使用的参数
  actualPrompt      String?
  actualNegativePrompt String?
  actualWidth       Int?
  actualHeight      Int?
  actualSteps       Int?
  actualCfg         Float?
  actualSeed        Int?
}
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   - `INFINI_AI_API_KEY`
   - `DATABASE_URL`（推荐使用 Vercel Postgres）
4. 部署完成后会自动配置 Blob 存储

## 特性说明

### 自动错误处理
- API 请求失败时会显示错误信息
- 生成失败的任务会记录错误原因
- 网络问题时会自动重试

### 实时状态更新
- 每5秒自动刷新工作流列表和生成状态
- 支持手动刷新
- 状态变化时会有视觉反馈

### 响应式设计
- 支持桌面端和移动端
- 自适应布局
- 现代化的用户界面

### 性能优化
- 图片懒加载
- 分页加载生成记录
- 批量任务自动限流（每个任务间隔2秒）

## 故障排除

### 常见问题
1. **API 密钥错误**: 检查 `INFINI_AI_API_KEY` 是否正确配置
2. **数据库连接失败**: 确认 `DATABASE_URL` 配置正确
3. **图片无法显示**: 检查 Vercel Blob 配置和网络连接
4. **生成任务卡住**: 查看控制台错误信息，可能是 API 限制

### 调试模式
开发环境下会在控制台输出详细的日志信息，包括：
- API 请求和响应
- 数据库操作
- 错误堆栈信息

## 扩展功能

### 计划中的功能
- [ ] 用户认证和权限管理
- [ ] 工作流模板和分享
- [ ] 生成历史统计
- [ ] 批量下载功能
- [ ] 工作流导入导出
- [ ] 更多图像生成参数支持

### 自定义扩展
系统采用模块化设计，可以轻松扩展：
- 添加新的生成参数
- 集成其他图像生成服务
- 自定义 UI 主题
- 添加数据分析功能

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## XY轴批量生成功能

### 🎯 功能概述
XY轴批量生成是一个强大的参数对比工具，允许用户设置两个不同的参数作为X轴和Y轴，系统会自动生成所有参数组合的图片，形成一个对比网格。

### 📊 支持的参数类型
- **提示词**: 测试不同提示词的效果
- **负向提示词**: 对比不同负向提示词的影响
- **图像尺寸**: 宽度和高度的组合测试
- **采样步数**: 不同步数的质量对比
- **CFG Scale**: CFG值对图像风格的影响
- **种子值**: 相同参数下的随机性对比

### 🎨 使用场景示例
1. **参数调优**: CFG (X轴) vs 采样步数 (Y轴)
2. **风格对比**: 不同提示词 (X轴) vs 不同CFG (Y轴)
3. **质量测试**: 不同尺寸 (X轴) vs 不同步数 (Y轴)
4. **随机性验证**: 不同种子值的效果对比

### 🔄 使用流程
1. 选择基础工作流
2. 配置基础参数（所有生成共用）
3. 设置X轴参数类型和值列表
4. 设置Y轴参数类型和值列表
5. 预览生成网格（显示总组合数）
6. 启动批量生成
7. 实时查看网格结果
8. 点击查看大图和详细参数
9. 批量下载所有完成的图片

### 💡 使用建议
- 建议从小网格开始测试（如2×2或3×3）
- 避免一次性生成过多图片（建议<25张）
- 合理设置任务间隔，避免API限制
- 使用有意义的参数对比，便于分析结果

### 📊 数据导出功能
- **Excel导出**: 生成包含汇总信息和详细数据的Excel文件
- **CSV导出**: 生成纯文本格式的CSV文件，便于其他工具处理
- **完整数据**: 包含所有参数组合、生成状态、图片信息、时间信息等
- **图片信息**: 包含图片URL、图片尺寸、是否包含图片等元数据
- **自动下载**: 点击导出按钮后自动下载到本地
- **文件命名**: 自动使用批次ID命名，便于识别和管理

#### 导出数据包含：
- **汇总信息**: 批次ID、总组合数、成功率等统计信息
- **详细数据**: 每个参数组合的完整信息
  - 位置坐标 (X轴位置, Y轴位置)
  - 参数值 (X轴参数值, Y轴参数值)
  - 生成状态和耗时
  - 实际使用的参数
  - 图片信息 (URL、尺寸、是否包含图片)
  - 错误信息和时间戳

## 许可证

MIT License
