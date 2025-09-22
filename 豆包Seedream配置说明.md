# 豆包 Seedream API 配置说明

## 概述

已成功配置豆包 Seedream API，使用您提供的 ARK_API_KEY 进行图像生成。

## 配置详情

### 环境变量
```env
ARK_API_KEY=a5ac169c-482b-43f1-b5ce-c7b23864243a
```

### API 配置
- **API URL**: `https://ark.cn-beijing.volces.com/api/v3/images/generations`
- **模型**: `doubao-seedream-4-0-250828`
- **认证方式**: Bearer Token (ARK_API_KEY)
- **响应格式**: URL

### 支持的参数
- **prompt**: 提示词（必填，最大800字符）
- **negative_prompt**: 负向提示词（可选，最大500字符）
- **size**: 图像尺寸（可选）
  - `1024x1024` (1:1)
  - `1024x1792` (9:16)
  - `1792x1024` (16:9)
  - `1664x2496` (2:3)
- **seed**: 随机种子（可选，0-2147483647）
- **watermark**: 水印（默认false）

## 工作流配置

### 工作流信息
- **名称**: 豆包 Seedream 图像生成 (ARK API)
- **描述**: 使用豆包 Seedream 模型生成高质量图像，支持多种尺寸比例 (配置了 ARK_API_KEY)
- **提供商**: `doubao_seedream`
- **ID**: `cmfqja8in00007586f4v19vu2`

### 默认参数
```json
{
  "provider": "doubao_seedream",
  "prompt": "一只可爱的小猫在花园里玩耍",
  "negative_prompt": "模糊, 低质量, 变形",
  "size": "1024x1024",
  "seed": 12345
}
```

## 测试结果

### ✅ 成功测试
- **API 调用**: 成功
- **图像生成**: 成功
- **图像下载**: 成功
- **OSS 上传**: 成功
- **图像访问**: 成功

### 测试示例
```
请求参数:
{
  "provider": "doubao_seedream",
  "prompt": "一只可爱的小猫在花园里玩耍",
  "negative_prompt": "模糊, 低质量, 变形",
  "size": "1024x1024",
  "seed": 12345
}

响应结果:
{
  "success": true,
  "imageUrls": [
    "https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/doubao-seedream-images/aceb61ab-aba9-40e1-9b23-818feeabe8b0.png"
  ]
}
```

## 使用方法

### 1. 通过前端界面
1. 访问 `http://localhost:3000/dashboard`
2. 点击"其他模型管理"标签页
3. 找到"豆包 Seedream 图像生成 (ARK API)"工作流
4. 点击"生成"按钮
5. 在参数表单中设置：
   - 提示词
   - 负向提示词（可选）
   - 图像尺寸
   - 随机种子（可选）
6. 点击"开始生成"

### 2. 通过 API 调用
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    provider: 'doubao_seedream',
    prompt: '一只可爱的小猫在花园里玩耍',
    negative_prompt: '模糊, 低质量, 变形',
    size: '1024x1024',
    seed: 12345
  })
});

const result = await response.json();
console.log(result.imageUrls); // 生成的图像URL数组
```

## 技术实现

### 代码修改
1. **lib/image-gen/doubao_seedream.ts**: 修改环境变量从 `SEED_EDIT_KEY` 到 `ARK_API_KEY`
2. **数据库工作流**: 更新工作流配置和描述
3. **API 路由**: 保持现有的路由逻辑不变

### 工作流程
1. 接收生成请求
2. 验证参数
3. 调用豆包 Seedream API
4. 下载生成的图像
5. 上传到 OSS 存储
6. 返回 OSS 图像 URL

## 注意事项

1. **API 密钥安全**: ARK_API_KEY 已正确配置在环境变量中
2. **图像存储**: 生成的图像会自动上传到 Vercel Blob 存储
3. **参数限制**: 提示词最大800字符，负向提示词最大500字符
4. **尺寸支持**: 支持4种不同的图像尺寸比例
5. **错误处理**: 包含完整的错误处理和日志记录

## 总结

✅ **配置完成**: 豆包 Seedream API 已成功配置并测试通过
✅ **功能正常**: 图像生成、下载、上传、访问全流程正常
✅ **集成完成**: 已集成到"其他模型管理"页面
✅ **参数支持**: 支持所有必要的生成参数
✅ **错误处理**: 包含完整的错误处理机制

现在您可以在 ComfXYZ-V3 项目中正常使用豆包 Seedream 进行图像生成了！
