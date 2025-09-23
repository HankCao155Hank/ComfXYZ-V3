'use client';

import { useEffect, useRef } from 'react';
import { useGenerationStore } from '../stores/useGenerationStore';
import { pollingManager } from '../utils/pollingManager';

interface UseGlobalPollingOptions {
  interval?: number; // 轮询间隔，默认2秒
  enabled?: boolean; // 是否启用轮询
  limit?: number; // 获取记录数量限制
  workflowId?: string; // 特定工作流ID
}

export function useGlobalPolling({
  interval = 2000, // 默认2秒，确保不超过1秒一次的要求
  enabled = true,
  limit = 50,
  workflowId
}: UseGlobalPollingOptions = {}) {
  const {
    generations,
    hasRunningTasks,
    fetchGenerations,
    setLoading
  } = useGenerationStore();
  
  const callbackRef = useRef<() => Promise<void>>();

  // 创建轮询回调函数
  const createPollingCallback = () => {
    return async () => {
      // 只有在有运行中任务时才轮询
      if (hasRunningTasks && enabled) {
        await fetchGenerations(limit, workflowId);
      }
    };
  };

  // 手动刷新
  const refresh = async () => {
    await fetchGenerations(limit, workflowId);
  };

  useEffect(() => {
    if (!enabled) return;

    // 创建新的回调函数
    callbackRef.current = createPollingCallback();
    
    // 订阅轮询管理器
    pollingManager.subscribe(callbackRef.current);

    return () => {
      if (callbackRef.current) {
        pollingManager.unsubscribe(callbackRef.current);
      }
    };
  }, [enabled, hasRunningTasks, limit, workflowId]);

  return {
    generations,
    hasRunningTasks,
    loading: useGenerationStore.getState().loading,
    refresh,
    isPolling: pollingManager.getStatus().isPolling
  };
}
