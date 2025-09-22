'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function SmartImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill, 
  className, 
  sizes, 
  priority,
  onClick 
}: SmartImageProps) {
  const [useNextImage, setUseNextImage] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 检查是否是Vercel Blob URL或其他需要特殊处理的URL
  const isVercelBlob = src.includes('blob.vercel-storage.com');
  const isInfiniAI = src.includes('cloud.infini-ai.com');

  // 如果图片加载失败或应该使用普通img标签
  if (!useNextImage || imageError) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
        style={fill ? { 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        } : undefined}
        onError={() => {
          console.warn('图片加载失败:', src);
          setImageError(true);
        }}
      />
    );
  }

  try {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        onClick={onClick}
        onError={() => {
          console.warn('Next.js Image 组件加载失败，回退到普通 img 标签:', src);
          setUseNextImage(false);
        }}
        unoptimized={isVercelBlob || isInfiniAI} // 对于这些域名不进行优化
      />
    );
  } catch (error) {
    console.warn('Image组件渲染失败，回退到普通img标签:', error);
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
        style={fill ? { 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        } : undefined}
        onError={() => {
          console.warn('图片加载失败:', src);
          setImageError(true);
        }}
      />
    );
  }
}
