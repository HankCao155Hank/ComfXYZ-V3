# Nano Banana XY轴批量轮询实现

## 概述

按照ComfyUI工作流的轮询方式，对Nano Banana的XY轴批量生成进行轮询机制修改，实现异步任务处理和状态监控。

## 修改内容

### 1. 添加轮询API端点

```typescript
// API 配置
const NANO_BANANA_API_URL = "https://api.ppinfra.com/v3/gemini-2.5-flash-image-preview-image-edit";
const NANO_BANANA_STATUS_URL = "https://api.ppinfra.com/v3/gemini-2.5-flash-image-preview-image-edit/status";
```

### 2. 实现轮询函数

```typescript
// 轮询任务状态 - 按照ComfyUI的方式实现
const pollNanoBananaTaskStatus = async (apiKey: string, taskId: string): Promise<string[]> => {
  const maxAttempts = 60; // 最多轮询60次（10分钟）
  const pollInterval = 10000; // 每10秒轮询一次
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(NANO_BANANA_STATUS_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task_id: taskId
        })
      });
      
      if (!response.ok) {
        throw new Error(`获取任务状态失败: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Nano Banana任务状态: ${data.status}, 进度: ${data.progress || 0}%`);
      
      // 状态说明: pending-等待中, running-运行中, completed-完成, failed-失败
      if (data.status === 'completed') {
        // 生成成功
        if (data.result?.image_urls && Array.isArray(data.result.image_urls)) {
          return data.result.image_urls;
        } else if (data.image_urls && Array.isArray(data.image_urls)) {
          return data.image_urls;
        } else {
          throw new Error("任务完成但未返回图像URL");
        }
      } else if (data.status === 'failed') {
        // 生成失败
        throw new Error(`图像生成失败: ${data.error || data.message || '未知错误'}`);
      } else if (data.status === 'error') {
        // 权限不足或其他错误
        throw new Error(`任务错误: ${data.error || data.message || '未知错误'}`);
      }
      
      // 继续等待
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`Nano Banana轮询第${attempt + 1}次失败:`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  throw new Error("Nano Banana任务超时，请稍后重试");
};
```

### 3. 修改主生成函数

```typescript
export async function generateNanoBananaImage(params: {
  prompt: string;
  image_urls: string[];
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // ... 参数验证和API Key检查 ...

    // 第一步：提交生成任务
    console.log("正在提交Nano Banana图像生成任务...");
    const response = await fetch(NANO_BANANA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // ... 错误处理 ...

    const result = await response.json();
    console.log("📡 API 成功响应:", JSON.stringify(result, null, 2));

    // 检查是否返回了任务ID（异步处理）
    let taskId: string | null = null;
    if (result.task_id) {
      taskId = result.task_id;
      console.log(`任务已提交，任务ID: ${taskId}`);
    } else if (result.id) {
      taskId = result.id;
      console.log(`任务已提交，任务ID: ${taskId}`);
    }

    // 如果有任务ID，进行轮询
    if (taskId) {
      console.log("正在等待Nano Banana图像生成完成...");
      const imageUrls = await pollNanoBananaTaskStatus(apiKey, taskId);
      if (!imageUrls || imageUrls.length === 0) {
        throw new Error("未获取到生成的图像");
      }
      
      const imageUrl = imageUrls[0];
      console.log("✅ 图像生成完成:", {
        image_url: imageUrl,
        total_images: imageUrls.length
      });

      return {
        success: true,
        url: imageUrl
      };
    }

    // 如果没有任务ID，检查直接返回的结果
    // ... 处理直接返回的结果 ...

  } catch (error: unknown) {
    // ... 错误处理 ...
  }
}
```

## 轮询机制特点

### 1. 与ComfyUI一致的轮询方式

- **轮询间隔**: 10秒
- **最大尝试次数**: 60次（10分钟）
- **状态检查**: 支持多种状态格式
- **错误处理**: 完善的错误重试机制

### 2. 状态处理

```typescript
// 状态说明: pending-等待中, running-运行中, completed-完成, failed-失败
if (data.status === 'completed') {
  // 生成成功 - 返回图像URL
} else if (data.status === 'failed') {
  // 生成失败 - 抛出错误
} else if (data.status === 'error') {
  // 任务错误 - 抛出错误
}
// 其他状态继续等待
```

### 3. 图像URL提取

支持多种响应格式：
- `data.result.image_urls`
- `data.image_urls`
- 直接返回的图像URL

## 优势

### 1. 异步处理
- 不阻塞主线程
- 支持长时间任务
- 更好的用户体验

### 2. 状态监控
- 实时任务状态更新
- 进度显示
- 错误追踪

### 3. 错误处理
- 网络错误重试
- 超时处理
- 详细错误信息

### 4. 兼容性
- 支持同步和异步API
- 向后兼容
- 灵活的状态处理

## 测试验证

### 1. 图片收集逻辑测试
```bash
node scripts/test-image-collection-only.js
```

### 2. 轮询机制测试
```bash
node scripts/test-nano-banana-polling.js
```

### 3. 完整功能测试
```bash
node scripts/test-nano-banana-complete.js
```

## 预期效果

1. **✅ 图片收集正确**: 3张图片（X轴+Y轴+默认参数）
2. **✅ 轮询机制工作**: 按照ComfyUI方式轮询任务状态
3. **✅ 状态更新及时**: 实时更新生成状态
4. **✅ 错误处理完善**: 网络错误和超时处理
5. **✅ 用户体验优化**: 异步处理，不阻塞界面

## 总结

通过按照ComfyUI的轮询方式修改Nano Banana的XY轴批量生成，实现了：

- **异步任务处理**: 支持长时间运行的图像生成任务
- **状态监控**: 实时跟踪任务进度和状态
- **错误处理**: 完善的错误重试和超时机制
- **兼容性**: 支持多种API响应格式
- **用户体验**: 不阻塞界面，提供实时反馈

这确保了Nano Banana的XY轴批量生成能够稳定、可靠地处理三张图片的融合任务。
