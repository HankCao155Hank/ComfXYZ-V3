#!/usr/bin/env node

/**
 * API连接测试脚本
 * 用于测试ComfyUI API的连接状态
 */

const https = require('https');

async function testAPIConnection() {
  const apiKey = process.env.INFINI_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ INFINI_AI_API_KEY 环境变量未配置');
    process.exit(1);
  }
  
  console.log('🔍 测试API连接...');
  console.log(`API Key: ${apiKey.substring(0, 8)}...`);
  
  const testData = {
    comfy_task_ids: ['test'],
    url_expire_period: 1800
  };
  
  const options = {
    hostname: 'cloud.infini-ai.com',
    port: 443,
    path: '/api/maas/comfy_task_api/get_task_info',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ComfyUI-Client/1.0'
    },
    timeout: 10000
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 响应状态: ${res.statusCode}`);
      console.log(`📡 响应头:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API连接成功');
          console.log('📄 响应数据:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          console.log('📄 原始响应:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ 请求超时');
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.write(JSON.stringify(testData));
    req.end();
  });
}

// 运行测试
testAPIConnection()
  .then(() => {
    console.log('🎉 API连接测试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 API连接测试失败:', error.message);
    process.exit(1);
  });
