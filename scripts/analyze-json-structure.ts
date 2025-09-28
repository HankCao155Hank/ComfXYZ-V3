import fs from 'fs';
import path from 'path';

// 分析JSON结构
function analyzeJsonStructure() {
  try {
    // 读取JSON文件
    const jsonPath = path.join(__dirname, '../output-images/meitu_result.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const result = JSON.parse(jsonContent);
    
    console.log('📋 JSON结构分析...');
    console.log('='.repeat(50));
    
    // 分析顶层结构
    console.log('\n🔍 顶层字段:');
    Object.keys(result).forEach(key => {
      const value = result[key];
      const type = typeof value;
      console.log(`  ${key}: ${type} ${type === 'object' && value !== null ? `(${Array.isArray(value) ? 'array' : 'object'})` : ''}`);
      
      if (type === 'string' && value.length > 100) {
        console.log(`    值: ${value.substring(0, 100)}...`);
      } else if (type === 'string') {
        console.log(`    值: ${value}`);
      } else if (type === 'object' && value !== null) {
        console.log(`    子字段: ${Object.keys(value).join(', ')}`);
      }
    });
    
    // 分析result字段
    if (result.result) {
      console.log('\n🔍 result字段详细分析:');
      console.log(`  id: ${result.result.id}`);
      
      if (result.result.parameters) {
        console.log('\n  parameters字段:');
        Object.keys(result.result.parameters).forEach(key => {
          const value = result.result.parameters[key];
          console.log(`    ${key}: ${typeof value} = ${value}`);
        });
      }
    }
    
    // 创建详细分析报告
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const reportPath = path.join(tmpDir, 'json_structure_analysis.txt');
    const report = `
JSON结构详细分析报告
==================

文件: output-images/meitu_result.json
分析时间: ${new Date().toLocaleString('zh-CN')}

顶层结构:
---------
${Object.keys(result).map(key => {
  const value = result[key];
  const type = typeof value;
  return `${key}: ${type}${type === 'object' && value !== null ? ` (${Array.isArray(value) ? 'array' : 'object'})` : ''}`;
}).join('\n')}

详细信息:
---------

1. 基本信息:
   - originalImageUrl: ${result.originalImageUrl}
   - taskId: ${result.taskId}
   - status: ${result.status}
   - timestamp: ${result.timestamp}

2. result字段:
   - id: ${result.result?.id || 'N/A'}
   
3. parameters字段:
${result.result?.parameters ? Object.keys(result.result.parameters).map(key => {
  const value = result.result.parameters[key];
  return `   - ${key}: ${typeof value} = ${value}`;
}).join('\n') : '   - 无parameters字段'}

图片信息提取:
------------
${result.originalImageUrl ? `
发现1个图片资源:
1. 原始图片
   - URL: ${result.originalImageUrl}
   - 类型: 用户上传的原始图片
   - 状态: 已处理完成
` : '未发现图片资源'}

结论:
-----
这是一个简化的API响应格式，包含：
- 基本的任务信息（ID、状态、时间戳）
- 原始图片URL
- 处理参数（但大部分为空值）

与之前解析的复杂分层图像JSON不同，这个文件似乎是一个更简单的响应格式，
可能表示任务已完成但没有返回详细的分层图像数据。
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 详细分析报告已保存: ${reportPath}`);
    
    // 生成JSON格式的分析结果
    const jsonReportPath = path.join(tmpDir, 'json_analysis.json');
    const analysisResult = {
      fileInfo: {
        path: jsonPath,
        size: fs.statSync(jsonPath).size,
        lastModified: fs.statSync(jsonPath).mtime
      },
      structure: {
        topLevelKeys: Object.keys(result),
        hasResult: !!result.result,
        hasParameters: !!result.result?.parameters,
        hasImageData: !!result.originalImageUrl
      },
      imageInfo: result.originalImageUrl ? [{
        type: 'original',
        url: result.originalImageUrl,
        description: '用户上传的原始图片'
      }] : [],
      analysis: {
        isComplexFormat: false,
        hasLayerData: false,
        hasTemplateData: false,
        format: 'simple_response'
      }
    };
    
    fs.writeFileSync(jsonReportPath, JSON.stringify(analysisResult, null, 2));
    console.log(`📄 JSON分析结果已保存: ${jsonReportPath}`);
    
    console.log('\n🎉 JSON结构分析完成！');
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

// 运行分析
analyzeJsonStructure();
