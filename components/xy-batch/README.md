# XY Batch Generator 组件重构

## 概述

原本的 `XYBatchGenerator` 组件有1000+行代码，违反了单一职责原则，难以维护。现在已将其拆分为多个小组件，提高代码可读性和可维护性。

## 组件结构

### 主组件
- **`XYBatchGenerator`** - 主容器组件，负责组合所有子组件

### 子组件
- **`WorkflowSelector`** - 工作流选择器
- **`AxisConfig`** - X/Y轴配置组件（可复用）
- **`InputFieldRenderer`** - 输入字段渲染器
- **`DefaultParamsConfig`** - 默认参数配置
- **`GenerationPreview`** - 生成预览网格
- **`GenerateButton`** - 生成按钮

### 自定义Hook
- **`useXYBatchLogic`** - 包含所有业务逻辑的状态管理Hook

## 文件结构

```
xy-batch/
├── index.ts                 # 导出文件
├── README.md               # 说明文档
├── WorkflowSelector.tsx    # 工作流选择器
├── AxisConfig.tsx          # 轴配置组件
├── InputFieldRenderer.tsx  # 输入字段渲染器
├── DefaultParamsConfig.tsx # 默认参数配置
├── GenerationPreview.tsx   # 生成预览
├── GenerateButton.tsx      # 生成按钮
└── hooks/
    └── useXYBatchLogic.ts  # 业务逻辑Hook
```

## 重构优势

### 1. 单一职责原则
- 每个组件只负责一个特定功能
- 代码更清晰，易于理解

### 2. 可复用性
- `AxisConfig` 组件可同时用于X轴和Y轴配置
- `InputFieldRenderer` 可在多个地方复用

### 3. 可维护性
- 问题定位更容易
- 修改影响范围更小
- 测试更容易编写

### 4. 可读性
- 主组件从1000+行减少到约160行
- 每个子组件职责明确
- 代码结构更清晰

### 5. 性能优化
- 可以使用 React.memo 优化不必要的重渲染
- 更容易实现代码分割

## 使用方式

```tsx
import { XYBatchGenerator } from './components/xy-batch-generator';

function MyComponent() {
  const handleGenerate = (config) => {
    // 处理生成逻辑
  };

  return (
    <XYBatchGenerator 
      onGenerate={handleGenerate}
      isGenerating={false}
    />
  );
}
```

## 扩展建议

1. **添加错误边界** - 为每个子组件添加错误处理
2. **性能优化** - 使用 React.memo 和 useMemo
3. **测试覆盖** - 为每个组件编写单元测试
4. **类型安全** - 完善 TypeScript 类型定义
5. **国际化** - 支持多语言
