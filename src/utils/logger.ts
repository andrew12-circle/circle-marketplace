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

  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (this.isDevelopment) {
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();