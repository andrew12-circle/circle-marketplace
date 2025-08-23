/**
 * Production-safe performance logger with sampling
 */

interface PerfLogEntry {
  action: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private logs: PerfLogEntry[] = [];
  private readonly maxLogs = 100;
  private readonly sampleRate = 0.1; // 10% sampling in production
  
  constructor() {
    // Clean up old logs periodically
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private shouldLog(): boolean {
    // Always log in QA mode
    if (new URLSearchParams(window.location.search).get('qa') === '1') {
      return true;
    }
    
    // Always log in development
    if (import.meta.env.DEV) {
      return true;
    }
    
    // Sample in production
    return Math.random() < this.sampleRate;
  }

  log(action: string, duration: number, metadata?: Record<string, any>) {
    if (!this.shouldLog()) return;
    
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

export const perfLogger = new PerformanceLogger();
