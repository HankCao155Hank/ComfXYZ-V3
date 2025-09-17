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

  // 如果 Next.js Image 组件失败，回退到普通 img 标签
  if (!useNextImage) {
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
        }}
      />
    );
  }

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
      unoptimized={src.includes('blob.vercel-storage.com')} // 对于 blob 存储不进行优化
    />
  );
}
