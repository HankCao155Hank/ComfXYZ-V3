#!/usr/bin/env node

/**
 * 图片下载测试脚本
 * 用于测试图片下载功能和网络连接
 */

const https = require('https');
const http = require('http');

async function testImageDownload(url) {
  console.log('🔍 测试图片下载功能...');
  console.log(`URL: ${url}`);
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const options = {
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'ComfyUI-Client/1.0',
        'Accept': 'image/*',
        'Connection': 'keep-alive'
      }
    };
    
    const req = protocol.get(url, options, (res) => {
      console.log(`📡 响应状态: ${res.statusCode}`);
      console.log(`📡 响应头:`, {
        'content-type': res.headers['content-type'],
        'content-length': res.headers['content-length'],
        'content-encoding': res.headers['content-encoding']
      });
      
      let data = '';
      let totalSize = 0;
      
      res.on('data', (chunk) => {
        data += chunk;
        totalSize += chunk.length;
        process.stdout.write(`\r📥 已下载: ${(totalSize / 1024).toFixed(2)} KB`);
      });
      
      res.on('end', () => {
        console.log(`\n✅ 图片下载完成，总大小: ${(totalSize / 1024).toFixed(2)} KB`);
        resolve({
          success: true,
          size: totalSize,
          contentType: res.headers['content-type']
        });
      });
      
      res.on('error', (error) => {
        console.error('\n❌ 响应错误:', error);
        reject(error);
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
    
    req.setTimeout(30000);
  });
}

// 测试函数
async function runTest() {
  const testUrl = process.argv[2];
  
  if (!testUrl) {
    console.error('❌ 请提供测试URL');
    console.log('使用方法: node scripts/test-image-download.js <图片URL>');
    process.exit(1);
  }
  
  try {
    const result = await testImageDownload(testUrl);
    console.log('🎉 图片下载测试成功');
    console.log('📊 结果:', result);
    process.exit(0);
  } catch (error) {
    console.error('💥 图片下载测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTest();
