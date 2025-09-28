# XY轴图片组合修复说明

## 问题描述
用户反馈在XY批量生成中，X轴只有一张图，Y轴也只有一张图，但是现在变成所有的图片一起放进去了。

从日志中可以看到：
```
image_urls: [
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/8fd14813-968d-4965-8d45-8abfa72ae39c.png',
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/046de8bf-aa5f-4255-88f1-bee85f7902bd.jpeg',
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/6b6bb887-230e-47f9-8fda-0d51428382fd.jpeg',
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/4c44876a-d17d-470e-b52e-7dd0c515973b.jpeg',
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/4ca11b17-a1c1-4553-8740-583f33de36d4.jpeg',
  'https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/nano-banana-inputs/5641f51f-2227-498a-8cf4-e4aa34bfad88.jpeg'
]
```

每个组合都包含了所有6张图片，而不是按照XY轴配置的组合。

## 根本原因
1. **默认参数重复应用**：默认参数中的图片被重复添加到了每个组合中
2. **图片字段过滤不完整**：没有正确排除所有图片相关的字段
3. **参数优先级错误**：默认参数覆盖了XY轴参数

## 修复内容

### 1. 修复默认参数应用逻辑
```typescript
// 修复前：只排除XY轴字段
if (inputKey !== xAxisInput && inputKey !== yAxisInput) {
  combinedParams[inputKey] = value;
}

// 修复后：排除XY轴字段和所有图片字段
if (inputKey !== xAxisInput && 
    inputKey !== yAxisInput && 
    !inputKey.startsWith('image') && 
    inputKey !== 'image_urls') {
  combinedParams[inputKey] = value;
}
```

### 2. 优化图片URL收集逻辑
```typescript
// 修复前：收集所有图片URL，包括默认参数
// 收集图片URL - 只收集当前组合的图片，不重复收集默认参数

// 修复后：只收集XY轴图片
// 收集图片URL - 只收集当前组合的XY轴图片
```

### 3. 添加调试日志
```typescript
console.log(`组合 ${xIndex}-${yIndex} 的图片URLs:`, image_urls);
```

## 修复后的预期行为

### 正确的参数组合：
- **组合 0-0**：X轴图片1 + Y轴图片1 + 默认参数中的非图片参数
- **组合 0-1**：X轴图片1 + Y轴图片2 + 默认参数中的非图片参数
- **组合 1-0**：X轴图片2 + Y轴图片1 + 默认参数中的非图片参数
- **组合 1-1**：X轴图片2 + Y轴图片2 + 默认参数中的非图片参数

### 关键改进：
1. **排除所有图片字段**：`!inputKey.startsWith('image')` 和 `inputKey !== 'image_urls'`
2. **只收集XY轴图片**：不重复收集默认参数中的图片
3. **正确的参数优先级**：XY轴参数 > 默认参数 > 原始工作流参数

## 测试验证

修复后，每个组合应该只包含：
- 1张X轴图片
- 1张Y轴图片
- 默认参数中的非图片参数（如prompt、temperature等）

而不是包含所有6张图片。

