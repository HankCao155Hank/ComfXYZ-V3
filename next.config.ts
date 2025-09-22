import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xutzfzlspaiec2vw.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      // 添加其他可能的图片域名
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.infini-ai.com',
        port: '',
        pathname: '/**',
      }
    ],
    // 禁用图片优化以避免某些域名的加载问题
    unoptimized: true,
  },
};

export default nextConfig;
