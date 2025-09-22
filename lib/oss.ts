import { put } from "@vercel/blob";

// OSS 存储接口
export interface OSSStore {
  put(filename: string, buffer: Buffer): Promise<{ url: string }>;
}

// Vercel Blob 存储实现
class VercelBlobStore implements OSSStore {
  async put(filename: string, buffer: Buffer): Promise<{ url: string }> {
    const { url } = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png'
    });
    return { url };
  }
}

// 获取 OSS 存储实例
export function getOSSStore(): OSSStore {
  return new VercelBlobStore();
}
