'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, Sparkles, Heart } from 'lucide-react';
import { SmartImage } from './smart-image';

interface ImageRevealProps {
  imageUrl: string;
  prompt: string;
  workflowName: string;
  generationId: string;
  onDownload?: () => void;
  onPreview?: () => void;
}

export function ImageReveal({ 
  imageUrl, 
  prompt, 
  workflowName, 
  generationId,
  onDownload,
  onPreview 
}: ImageRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // 延迟显示图片，创建揭示效果
    const timer = setTimeout(() => {
      setIsRevealed(true);
      setShowConfetti(true);
      
      // 3秒后隐藏庆祝效果
      setTimeout(() => setShowConfetti(false), 3000);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${workflowName}-${generationId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error('下载图片失败:', error);
    }
  };

  return (
    <Card className="overflow-hidden relative">
      {/* 庆祝效果 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 left-4 animate-bounce">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute top-4 right-4 animate-bounce delay-100">
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <div className="absolute bottom-4 left-4 animate-bounce delay-200">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="absolute bottom-4 right-4 animate-bounce delay-300">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* 成功消息 */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-green-800">🎉 图像生成成功！</h3>
          </div>
          <p className="text-sm text-green-700">
            <strong>{workflowName}</strong> 已完成生成
          </p>
          <p className="text-xs text-green-600 mt-1 line-clamp-2">
            &ldquo;{prompt}&rdquo;
          </p>
        </div>

        {/* 图片展示区域 */}
        <div className="relative group">
          <div className={`aspect-[4/3] max-w-md mx-auto relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 transition-all duration-1000 ${
            isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            {isRevealed && (
              <SmartImage
                src={imageUrl}
                alt="Generated image"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            )}
            
            {/* 悬停操作按钮 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => onPreview && onPreview()}
                  className="backdrop-blur-sm"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  预览
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={downloadImage}
                  className="backdrop-blur-sm"
                >
                  <Download className="w-5 h-5 mr-2" />
                  下载
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              生成ID: {generationId}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onPreview && onPreview()}>
                <Eye className="w-4 h-4 mr-1" />
                查看大图
              </Button>
              <Button size="sm" onClick={downloadImage}>
                <Download className="w-4 h-4 mr-1" />
                保存图片
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
