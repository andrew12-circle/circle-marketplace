/**
 * Opt-in performance logger that doesn't auto-start
 */

interface PerfLogEntry {
  action: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class SafePerformanceLogger {
  private logs: PerfLogEntry[] = [];
  private readonly maxLogs = 100;
  private readonly sampleRate = 0.1; // 10% sampling in production
  private isRunning = false;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  private shouldLog(): boolean {
    // Always log in QA mode
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('qa') === '1') {
      return true;
    }
    
    // Always log in development
    if (import.meta.env.DEV) {
      return true;
    }
    
    // Sample in production
    return Math.random() < this.sampleRate;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Clean up old logs periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.logs = [];
  }

  log(action: string, duration: number, metadata?: Record<string, any>) {
    if (!this.isRunning || !this.shouldLog()) return;
    
    this.logs.push({
      action,
      duration,
      timestamp: Date.now(),
      metadata
    });
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  startTimer(action: string): () => void {
    if (!this.isRunning) return () => {};
    
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.log(action, duration, metadata);
    };
  }

  private cleanup() {
    const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
  }

  getRecentLogs(): PerfLogEntry[] {
    return [...this.logs].reverse().slice(0, 20);
  }

  getSummary(): { action: string; avgDuration: number; count: number }[] {
    const summary = new Map<string, { total: number; count: number }>();
    
    this.logs.forEach(log => {
      const existing = summary.get(log.action) || { total: 0, count: 0 };
      existing.total += log.duration;
      existing.count += 1;
      summary.set(log.action, existing);
    });
    
    return Array.from(summary.entries()).map(([action, { total, count }]) => ({
      action,
      avgDuration: Math.round(total / count),
      count
    })).sort((a, b) => b.avgDuration - a.avgDuration);
  }
}

export const safePerfLogger = new SafePerformanceLogger();
