import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

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

    const uploadResults = [];

    // 批量上传文件到Vercel Blob
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
        // 转换File为Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 生成唯一文件名
        const fileExtension = file.name.split('.').pop() || 'png';
        const fileName = `nano-banana-inputs/${uuidv4()}.${fileExtension}`;
        
        console.log(`📤 开始上传文件 ${file.name} 到 Vercel Blob...`);
        
        // 上传到Vercel Blob
        const { url } = await put(fileName, buffer, {
          access: 'public',
          contentType: file.type
        });

        console.log(`✅ 文件 ${file.name} 上传成功:`, url);

        uploadResults.push({
          filename: file.name,
          key: fileName,
          url: url
        });

      } catch (error) {
        console.error(`❌ 文件 ${file.name} 上传失败:`, error);
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
