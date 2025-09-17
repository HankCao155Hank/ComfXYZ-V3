'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';

interface GenerationStatusProps {
  generationId: string;
  onComplete?: (blobUrl: string) => void;
  onError?: (error: string) => void;
}

export function GenerationStatus({ generationId, onComplete, onError }: GenerationStatusProps) {
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/generations?limit=10`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        return;
      }
      
      if (data.success && data.data.generations.length > 0) {
        const generation = data.data.generations.find((g: any) => g.id === generationId);
        if (generation) {
          setStatus(generation.status);
          
          // 根据状态设置进度
          switch (generation.status) {
            case 'pending':
              setProgress(10);
              break;
            case 'running':
              // 模拟运行进度（基于时间）
              const elapsed = Date.now() - startTime;
              const estimatedTotal = 120000; // 预估2分钟完成
              const timeProgress = Math.min((elapsed / estimatedTotal) * 80, 80); // 最多80%
              setProgress(20 + timeProgress);
              break;
            case 'completed':
              setProgress(100);
              if (generation.blobUrl && onComplete) {
                onComplete(generation.blobUrl);
              }
              break;
            case 'failed':
              setProgress(0);
              if (generation.errorMsg && onError) {
                onError(generation.errorMsg);
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error('获取生成状态失败:', error);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: '等待处理',
          description: '任务已提交，正在队列中等待处理',
          color: 'bg-yellow-500'
        };
      case 'running':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />,
          text: '正在生成',
          description: 'AI正在根据您的提示词创建图像',
          color: 'bg-blue-500'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: '生成完成',
          description: '图像已成功生成并保存',
          color: 'bg-green-500'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: '生成失败',
          description: '图像生成过程中出现错误',
          color: 'bg-red-500'
        };
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-gray-500" />,
          text: '未知状态',
          description: '正在获取状态信息',
          color: 'bg-gray-500'
        };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  useEffect(() => {
    fetchStatus();
    
    const statusInterval = setInterval(fetchStatus, 2000); // 每2秒检查状态
    const timeInterval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000); // 每秒更新时间

    return () => {
      clearInterval(statusInterval);
      clearInterval(timeInterval);
    };
  }, [generationId]);

  const statusInfo = getStatusInfo(status);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 状态头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusInfo.icon}
              <div>
                <h3 className="font-semibold">{statusInfo.text}</h3>
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-white ${statusInfo.color}`}>
                {statusInfo.text}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                已用时: {formatTime(timeElapsed)}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 状态特定的额外信息 */}
          {status === 'running' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                <p className="text-sm text-blue-700">
                  正在生成中... 预计还需要 {Math.max(0, 120 - timeElapsed)} 秒
                </p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-700">
                  任务在队列中，请耐心等待处理
                </p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-700">
                  🎉 图像生成成功！总用时: {formatTime(timeElapsed)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
