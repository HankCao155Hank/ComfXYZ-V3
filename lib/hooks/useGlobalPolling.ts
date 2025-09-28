'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGenerationStore } from '../stores/useGenerationStore';
import { pollingManager } from '../utils/pollingManager';

interface UseGlobalPollingOptions {
  interval?: number; // 轮询间隔，默认2秒
  enabled?: boolean; // 是否启用轮询
  limit?: number; // 获取记录数量限制
  workflowId?: string; // 特定工作流ID
  generationId?: string; // 特定生成任务ID
}

export function useGlobalPolling({
  interval: _interval = 2000, // 默认2秒，确保不超过1秒一次的要求
  enabled = true,
  limit = 50,
  workflowId,
  generationId
}: UseGlobalPollingOptions = {}) {
  const {
    generations,
    hasRunningTasks,
    fetchGenerations,
    loading
  } = useGenerationStore();
  
  const callbackRef = useRef<() => Promise<void>>(undefined);

  // 创建轮询回调函数 - 使用useCallback避免重复创建
  const createPollingCallback = useCallback(() => {
    return async () => {
      if (enabled) {
        await fetchGenerations(limit, workflowId);
      }
    };
  }, [enabled, fetchGenerations, limit, workflowId]);

  // 手动刷新 - 使用useCallback稳定函数引用
  const refresh = useCallback(async () => {
    await fetchGenerations(limit, workflowId);
  }, [fetchGenerations, limit, workflowId]);

  useEffect(() => {
    // 完全禁用自动轮询，只允许手动刷新
    if (!enabled) return;

    // 只在有特定生成任务时才启用轮询
    if (generationId) {
      callbackRef.current = createPollingCallback();
      pollingManager.subscribe(callbackRef.current);
    }

    return () => {
      if (callbackRef.current) {
        pollingManager.unsubscribe(callbackRef.current);
      }
    };
  }, [enabled, generationId, createPollingCallback]);

  return {
    generations,
    hasRunningTasks,
    loading,
    refresh,
    isPolling: pollingManager.getStatus().isPolling
  };
}
