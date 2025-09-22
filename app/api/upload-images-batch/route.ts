import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件数量限制
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: '最多只能上传10张图片' },
        { status: 400 }
      );
    }

    const apiKey = process.env.INFINI_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    const uploadResults = [];

    // 批量上传文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: `文件 ${file.name} 不是图片格式` },
          { status: 400 }
        );
      }

      // 验证文件大小 (10MB限制)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `文件 ${file.name} 大小不能超过10MB` },
          { status: 400 }
        );
      }

      try {
        // 创建FormData用于上传到OSS
        const uploadFormData = new FormData();
        uploadFormData.append('source_file', file);

        // 上传到Infini AI OSS
        const response = await fetch('https://cloud.infini-ai.com/api/maas/comfy_task_api/upload/image', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: uploadFormData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`文件 ${file.name} OSS上传失败:`, response.status, errorText);
          throw new Error(`文件 ${file.name} 上传失败`);
        }

        const result = await response.json();
        console.log(`文件 ${file.name} OSS上传响应:`, result);
        
        // 检查不同的响应格式
        let imageKey = null;
        let imageUrl = null;
        
        if (result.code === 0 && result.data?.image_id) {
          // 新格式：使用image_id
          imageKey = result.data.image_id;
          imageUrl = result.data.image_id; // 使用image_id作为URL
        } else if (result.success && result.data?.key) {
          // 旧格式
          imageKey = result.data.key;
          imageUrl = result.data.url;
        } else if (result.data?.filename) {
          // 其他格式可能使用filename
          imageKey = result.data.filename;
          imageUrl = result.data.url || result.data.path;
        } else if (result.filename) {
          // 直接返回filename
          imageKey = result.filename;
          imageUrl = result.url || result.path;
        } else {
          console.error(`文件 ${file.name} OSS上传响应异常:`, result);
          throw new Error(`文件 ${file.name} 上传响应异常`);
        }

        uploadResults.push({
          filename: file.name,
          key: imageKey,
          url: imageUrl
        });

      } catch (error) {
        console.error(`文件 ${file.name} 上传失败:`, error);
        return NextResponse.json(
          { success: false, error: `文件 ${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      uploaded_files: uploadResults,
      total_count: uploadResults.length
    });

  } catch (error) {
    console.error('批量图片上传失败:', error);
    return NextResponse.json(
      { success: false, error: '批量图片上传失败' },
      { status: 500 }
    );
  }
}
