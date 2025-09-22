import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '只支持图片文件' },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB限制)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过10MB' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      key: fileName,
      url: url
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { success: false, error: '图片上传失败' },
      { status: 500 }
    );
  }
}
