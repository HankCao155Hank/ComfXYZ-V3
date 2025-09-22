# ComfXYZ-V3 新增 API 提供商

## 概述

ComfXYZ-V3 项目现已支持多种图像生成 API 提供商，包括：

1. **无问芯穹 (ComfyUI)** - 原有功能
2. **美图 AI 开放平台** - 图像修复和编辑
3. **通义千问图像生成** - 阿里云 DashScope 服务
4. **豆包 Seedream** - 字节跳动图像生成服务

## 新增功能

### 1. 通义千问图像生成 (qwen_image)

**特点：**
- 支持多种尺寸比例
- 高质量图像生成
- 支持负向提示词
- 支持随机种子

**支持的尺寸：**
- `1328*1328` (1:1) - 默认
- `1664*928` (16:9)
- `1472*1140` (4:3)
- `1140*1472` (3:4)
- `928*1664` (9:16)

**使用示例：**
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'qwen_image',
    prompt: '一只可爱的小猫在花园里玩耍',
    negative_prompt: '模糊, 低质量',
    size: '1328*1328',
    seed: 12345
  })
});
```

### 2. 豆包 Seedream (doubao_seedream)

**特点：**
- 先进的图像生成技术
- 支持多种尺寸比例
- 高质量输出
- 支持负向提示词

**支持的尺寸：**
- `1024x1024` (1:1) - 默认
- `1024x1792` (9:16)
- `1792x1024` (16:9)
- `1664x2496` (2:3)

**使用示例：**
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'doubao_seedream',
    prompt: '一只聪明的小狗在公园里奔跑',
    negative_prompt: '模糊, 低质量',
    size: '1024x1024',
    seed: 54321
  })
});
```

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 通义千问图像生成 API 密钥
DASHSCOPE_API_KEY=your_dashscope_api_key_here

# 豆包 Seedream 图像生成 API 密钥
SEED_EDIT_KEY=your_seed_edit_key_here

# 美图 AI 开放平台 API 密钥
MEITU_API_KEY=your_meitu_api_key_here

# 无问芯穹 API 密钥
INFINI_AI_API_KEY=your_infini_ai_api_key_here
```

## 前端界面更新

### 参数设置表单

在参数设置表单中，用户现在可以选择以下 API 提供商：

1. **无问芯穹 (ComfyUI)** - 显示传统的 ComfyUI 工作流参数
2. **美图 AI 开放平台** - 显示图片 URL 和蒙版 URL 输入框
3. **通义千问图像生成** - 显示图像尺寸选择下拉框
4. **豆包 Seedream** - 显示图像尺寸选择下拉框

### 动态参数显示

根据选择的 API 提供商，表单会动态显示相应的参数输入框：

- **美图 API**：显示图片 URL 和蒙版 URL 输入框
- **通义千问/豆包**：显示图像尺寸选择下拉框
- **无问芯穹**：显示传统的 ComfyUI 参数（宽度、高度、步数等）

## API 统一接口

所有 API 提供商都使用统一的调用接口：

```typescript
interface APIRequest {
  provider: string;           // API 提供商
  prompt: string;            // 提示词
  negative_prompt?: string;  // 负向提示词
  size?: string;            // 图像尺寸
  seed?: number;            // 随机种子
  // 其他特定参数...
}
```

**统一返回格式：**
```typescript
interface APIResponse {
  success: boolean;
  imageUrls: string[];      // 生成的图像 URL 数组
  error?: string;           // 错误信息（如果失败）
}
```

## 技术实现

### 1. 模块化设计

- `lib/image-gen/` - 图像生成模块
- `lib/oss.ts` - OSS 存储工具类
- `lib/comfy.ts` - 统一的 API 调用接口

### 2. 类型安全

使用 TypeScript 接口确保类型安全：
- `ImageGenerationParams` - 图像生成参数
- `ImageGenerationResult` - 生成结果
- `MeituAPIParams` - 美图 API 参数

### 3. 错误处理

完善的错误处理机制：
- 参数验证
- API 调用错误处理
- 图像下载和上传错误处理

## 测试

运行测试脚本验证功能：

```bash
node test-new-apis.js
```

## 注意事项

1. **API 密钥**：确保在环境变量中正确配置所有 API 密钥
2. **尺寸格式**：不同 API 使用不同的尺寸格式（`*` vs `x`）
3. **限流**：批量生成时会自动添加延迟避免触发 API 限流
4. **存储**：所有生成的图像都会自动上传到 Vercel Blob 存储
5. **兼容性**：新功能完全向后兼容，不影响现有功能

## 扩展性

要添加新的 API 提供商：

1. 在 `lib/image-gen/` 中创建新的 API 实现文件
2. 在 `lib/image-gen/index.ts` 中添加模型配置
3. 在 `lib/comfy.ts` 中添加新的 API 调用函数
4. 在前端表单中添加新的选项
5. 更新环境变量配置

这种模块化设计使得添加新的 API 提供商变得非常简单和可维护。
