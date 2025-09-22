# ComfXYZ-V3 API 扩展说明

## 概述

本项目已扩展支持多个 AI 图像生成 API 提供商，目前支持：
- 无问芯穹 (wuwen) - 原有功能
- 美图 AI 开放平台 (meitu) - 新增功能

## 环境配置

在项目根目录创建 `.env` 文件，添加以下配置：

```env
# API 提供商配置（默认：wuwen）
API_PROVIDER=wuwen

# 美图 AI 开放平台 API 密钥
MEITU_API_KEY=your_meitu_api_key_here

# 无问芯穹 API 密钥（现有配置）
INFINI_AI_API_KEY=your_infini_ai_api_key_here
```

## API 使用方式

### 1. 无问芯穹 API

**参数：**
- `provider`: "wuwen"
- `workflowId`: 工作流 ID
- `customParams`: 自定义参数对象

**示例：**
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'wuwen',
    workflowId: 'your-workflow-id',
    customParams: {
      prompt: '一只可爱的小猫',
      width: 1024,
      height: 1024
    }
  })
});
```

### 2. 美图 AI 开放平台 API

**参数：**
- `provider`: "meitu"
- `image_url`: 要处理的图片 URL
- `mask_url`: 蒙版图片 URL
- `prompt`: 提示词

**示例：**
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'meitu',
    image_url: 'https://example.com/image.jpg',
    mask_url: 'https://example.com/mask.jpg',
    prompt: '将背景替换为海滩'
  })
});
```

## 前端界面

在参数设置表单中，用户可以选择 API 提供商：

1. **无问芯穹**：显示传统的图像生成参数（宽度、高度、步数等）
2. **美图 AI**：显示图片 URL 和蒙版 URL 输入框

## 返回格式

所有 API 调用都返回统一的格式：

```json
{
  "success": true,
  "imageUrls": ["https://example.com/result.jpg"]
}
```

## 测试

运行测试脚本：

```bash
node test-api.js
```

## 注意事项

1. 美图 API 需要有效的 API 密钥
2. 美图 API 的图片 URL 和蒙版 URL 必须是可公开访问的
3. 无问芯穹 API 需要配置工作流 ID
4. 所有生成的图片都会自动保存到 Vercel Blob 存储

## 扩展新的 API 提供商

要添加新的 API 提供商：

1. 在 `lib/comfy.ts` 中添加新的 API 调用函数
2. 在 `callAPI` 函数中添加新的 case
3. 在前端表单中添加新的选项
4. 更新环境变量配置

## 故障排除

- 检查环境变量是否正确配置
- 确认 API 密钥有效
- 查看控制台日志获取详细错误信息
- 验证图片 URL 的可访问性（美图 API）
