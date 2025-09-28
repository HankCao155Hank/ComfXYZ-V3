import * as fs from 'fs';
import * as path from 'path';
import { Signer, HeaderHost, HeaderXDate } from './meitu-demo/sign';

/**
 * 美图API配置
 */
const key = "da41df2171734fd7b909874131826770";
const secret = "b6ae6c5853094945a2a01365a3417854";
const BASE_URL = 'https://openapi.meitu.com';

/**
 * 生成curl命令
 */
function generateCurlCommand(imageUrl: string): string {
    const url = `${BASE_URL}/whee/business/image_layering.json`;
    const method = 'POST';
    const requestBody = { image_file: imageUrl };
    const body = JSON.stringify(requestBody);
    
    const headers = {
        'Content-Type': 'application/json',
        'X-Sdk-Content-Sha256': 'UNSIGNED-PAYLOAD',
        [HeaderHost]: 'openapi.meitu.com'
    };
    
    // 使用签名器生成正确的请求选项
    const signer = new Signer(key, secret);
    const requestOptions = signer.sign(url, method, headers, body);
    
    // 构建curl命令
    let curlCommand = `curl -X POST "${url}" \\\n`;
    curlCommand += `  -H "Content-Type: application/json" \\\n`;
    curlCommand += `  -H "X-Sdk-Content-Sha256: UNSIGNED-PAYLOAD" \\\n`;
    curlCommand += `  -H "X-Sdk-Date: ${requestOptions.headers['X-Sdk-Date']}" \\\n`;
    curlCommand += `  -H "Host: openapi.meitu.com" \\\n`;
    curlCommand += `  -H "Authorization: ${requestOptions.headers['Authorization']}" \\\n`;
    curlCommand += `  -d '${body}'`;
    
    return curlCommand;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('🔧 生成美图API Curl命令');
        console.log('=======================');
        
        const imageUrl = "https://xutzfzlspaiec2vw.public.blob.vercel-storage.com/generated-image-1757626626645.png";
        
        console.log(`🖼️  图片URL: ${imageUrl}`);
        console.log('');
        
        // 生成curl命令
        const curlCommand = generateCurlCommand(imageUrl);
        
        console.log('📋 生成的curl命令:');
        console.log('==================');
        console.log(curlCommand);
        console.log('');
        
        // 保存curl命令到文件
        const outputPath = './output-images/meitu_curl_command.sh';
        const scriptContent = `#!/bin/bash

# 美图API Curl命令 (自动生成)
echo "🎨 执行美图API请求..."
echo ""

${curlCommand}

echo ""
echo "📊 请求完成!"
`;
        
        // 确保输出文件夹存在
        if (!fs.existsSync('./output-images')) {
            fs.mkdirSync('./output-images', { recursive: true });
        }
        
        fs.writeFileSync(outputPath, scriptContent);
        
        // 给脚本添加执行权限
        fs.chmodSync(outputPath, '755');
        
        console.log(`📄 Curl命令已保存到: ${outputPath}`);
        console.log('🚀 可以直接运行: ./output-images/meitu_curl_command.sh');
        
    } catch (error) {
        console.error('❌ 生成curl命令失败:', error);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

export { generateCurlCommand };
