'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Generation {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  blobUrl?: string;
  errorMsg?: string;
  startedAt: string;
  completedAt?: string;
  workflowId: string;
  workflow?: {
    id: string;
    name: string;
    description?: string;
  };
  actualPrompt?: string;
  actualNegativePrompt?: string;
  actualWidth?: number;
  actualHeight?: number;
  actualSteps?: number;
  actualCfg?: number;
  actualSeed?: string;
}

interface GenerationStore {
  // State
  generations: Generation[];
  loading: boolean;
  lastFetch: number;
  hasRunningTasks: boolean;
  
  // Actions
  setGenerations: (generations: Generation[]) => void;
  setLoading: (loading: boolean) => void;
  updateGeneration: (id: string, updates: Partial<Generation>) => void;
  checkRunningTasks: () => void;
  fetchGenerations: (limit?: number, workflowId?: string) => Promise<void>;
  
  // Computed
  getGenerationById: (id: string) => Generation | undefined;
  getGenerationsByWorkflow: (workflowId: string) => Generation[];
}

export const useGenerationStore = create<GenerationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    generations: [],
    loading: false,
    lastFetch: 0,
    hasRunningTasks: false,

    // Actions
    setGenerations: (generations) => {
      const hasRunningTasks = generations.some(gen => 
        gen.status === 'pending' || gen.status === 'running'
      );
      set({ 
        generations,
        lastFetch: Date.now(),
        hasRunningTasks
      });
    },

    setLoading: (loading) => set({ loading }),

    updateGeneration: (id, updates) => set((state) => {
      const updatedGenerations = state.generations.map(gen => 
        gen.id === id ? { ...gen, ...updates } : gen
      );
      const hasRunningTasks = updatedGenerations.some(gen => 
        gen.status === 'pending' || gen.status === 'running'
      );
      return {
        generations: updatedGenerations,
        hasRunningTasks
      };
    }),

    checkRunningTasks: () => set((state) => ({
      hasRunningTasks: state.generations.some(gen => 
        gen.status === 'pending' || gen.status === 'running'
      )
    })),

    fetchGenerations: async (limit = 50, workflowId?: string) => {
      const state = get();
      
      // 防止过于频繁的请求（最多5秒一次）
      const now = Date.now();
      if (now - state.lastFetch < 5000) {
        console.log('跳过请求：过于频繁');
        return;
      }

      // 如果正在加载中，跳过请求
      if (state.loading) {
        console.log('跳过请求：正在加载中');
        return;
      }

      set({ loading: true });

      try {
        const params = new URLSearchParams();
        if (workflowId) params.set('workflowId', workflowId);
        params.set('limit', limit.toString());

        const response = await fetch(`/api/generations?${params}`);
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

        if (data.success) {
          get().setGenerations(data.data.generations);
        }
      } catch (error) {
        console.error('获取生成记录失败:', error);
      } finally {
        set({ loading: false });
      }
    },

    // Computed getters
    getGenerationById: (id) => {
      return get().generations.find(gen => gen.id === id);
    },

    getGenerationsByWorkflow: (workflowId) => {
      return get().generations.filter(gen => gen.workflowId === workflowId);
    },
  }))
);
