'use client';

class PollingManager {
  private static instance: PollingManager;
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private subscribers: Set<() => Promise<void>> = new Set();
  private lastFetch = 0;
  private readonly MIN_INTERVAL = 2000; // 最小间隔2秒
  private debounceTimer: NodeJS.Timeout | null = null;

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

      // 执行所有订阅者的回调，使用防抖机制
      if (this.subscribers.size > 0) {
        const promises = Array.from(this.subscribers).map(callback => 
          callback().catch(error => {
            console.warn('轮询回调执行失败:', error);
          })
        );
        await Promise.allSettled(promises);
      }
    };

    // 延迟执行，避免立即执行
    setTimeout(poll, 1000);

    // 设置定时轮询（3秒间隔，减少频率）
    this.intervalId = setInterval(poll, 3000);
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

  // 手动触发轮询 - 使用防抖机制
  async triggerPolling() {
    if (this.subscribers.size === 0) return;

    // 清除之前的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 设置防抖延迟
    this.debounceTimer = setTimeout(async () => {
      const now = Date.now();
      if (now - this.lastFetch < this.MIN_INTERVAL) {
        return;
      }

      this.lastFetch = now;
      
      const promises = Array.from(this.subscribers).map(callback => 
        callback().catch(error => {
          console.warn('手动轮询回调执行失败:', error);
        })
      );
      await Promise.allSettled(promises);
    }, 500); // 500ms防抖延迟
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
