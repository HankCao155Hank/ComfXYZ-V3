'use client';

class PollingManager {
  private static instance: PollingManager;
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private subscribers: Set<() => Promise<void>> = new Set();
  private lastFetch = 0;
  private readonly MIN_INTERVAL = 1000; // 最小间隔1秒

  private constructor() {}

  static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  // 订阅轮询
  subscribe(callback: () => Promise<void>) {
    this.subscribers.add(callback);
    
    // 如果当前没有轮询且有订阅者，开始轮询
    if (!this.isPolling && this.subscribers.size > 0) {
      this.startPolling();
    }
  }

  // 取消订阅轮询
  unsubscribe(callback: () => Promise<void>) {
    this.subscribers.delete(callback);
    
    // 如果没有订阅者了，停止轮询
    if (this.subscribers.size === 0) {
      this.stopPolling();
    }
  }

  // 开始轮询
  private startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    
    const poll = async () => {
      const now = Date.now();
      
      // 确保不超过最小间隔
      if (now - this.lastFetch < this.MIN_INTERVAL) {
        return;
      }

      this.lastFetch = now;

      // 执行所有订阅者的回调
      const promises = Array.from(this.subscribers).map(callback => callback());
      await Promise.allSettled(promises);
    };

    // 立即执行一次
    poll();

    // 设置定时轮询（2秒间隔）
    this.intervalId = setInterval(poll, 2000);
  }

  // 停止轮询
  private stopPolling() {
    if (!this.isPolling) return;

    this.isPolling = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 手动触发轮询
  async triggerPolling() {
    if (this.subscribers.size === 0) return;

    const now = Date.now();
    if (now - this.lastFetch < this.MIN_INTERVAL) {
      return;
    }

    this.lastFetch = now;
    
    const promises = Array.from(this.subscribers).map(callback => callback());
    await Promise.allSettled(promises);
  }

  // 获取当前状态
  getStatus() {
    return {
      isPolling: this.isPolling,
      subscribers: this.subscribers.size,
      lastFetch: this.lastFetch
    };
  }
}

export const pollingManager = PollingManager.getInstance();
