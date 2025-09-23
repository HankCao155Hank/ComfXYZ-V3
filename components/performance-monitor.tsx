'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, Users } from 'lucide-react';
import { pollingManager } from '@/lib/utils/pollingManager';
import { useGenerationStore } from '@/lib/stores/useGenerationStore';

interface PerformanceMonitorProps {
  showDetails?: boolean;
}

export function PerformanceMonitor({ showDetails = false }: PerformanceMonitorProps) {
  const [status, setStatus] = useState(pollingManager.getStatus());
  const [apiCalls, setApiCalls] = useState(0);
  const [lastCallTime, setLastCallTime] = useState<number>(0);
  
  const { generations, hasRunningTasks } = useGenerationStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(pollingManager.getStatus());
      setApiCalls(prev => prev + 1);
      setLastCallTime(pollingManager.getStatus().lastFetch);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return '从未';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return '刚刚';
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    return `${Math.floor(diff / 60000)}分钟前`;
  };

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${status.isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-gray-600 dark:text-gray-300">
              {status.isPolling ? '轮询中' : '已停止'}
            </span>
            <Badge variant={hasRunningTasks ? 'default' : 'secondary'} className="text-xs">
              {hasRunningTasks ? '有任务' : '无任务'}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          性能监控
        </CardTitle>
        <CardDescription>
          实时监控API调用和轮询状态
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 轮询状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm">轮询状态</span>
          </div>
          <Badge variant={status.isPolling ? 'default' : 'secondary'}>
            {status.isPolling ? '运行中' : '已停止'}
          </Badge>
        </div>

        {/* 订阅者数量 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">活跃组件</span>
          </div>
          <Badge variant="outline">
            {status.subscribers} 个
          </Badge>
        </div>

        {/* 最后调用时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">最后调用</span>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {formatTime(lastCallTime)}
          </span>
        </div>

        {/* 任务状态 */}
        <div className="flex items-center justify-between">
          <span className="text-sm">运行中任务</span>
          <Badge variant={hasRunningTasks ? 'default' : 'secondary'}>
            {generations.filter(g => g.status === 'pending' || g.status === 'running').length} 个
          </Badge>
        </div>

        {/* 总生成记录 */}
        <div className="flex items-center justify-between">
          <span className="text-sm">总记录数</span>
          <Badge variant="outline">
            {generations.length} 条
          </Badge>
        </div>

        {/* 手动触发按钮 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => pollingManager.triggerPolling()}
          className="w-full"
        >
          手动刷新
        </Button>
      </CardContent>
    </Card>
  );
}
