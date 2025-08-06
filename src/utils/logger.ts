/**
 * Custom Logger Utility
 * Disabled in production for performance optimization
 */

interface LogLevel {
  LOG: 'log';
  WARN: 'warn';
  ERROR: 'error';
  INFO: 'info';
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  // Force disable in production for performance
  private isEnabled = this.isDevelopment && import.meta.env.MODE !== 'production';

  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isEnabled) {
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (this.isEnabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isEnabled) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();