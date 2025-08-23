/**
 * TypeScript Debug Utilities
 * Provides type-safe debugging functions for development
 */

// Debug levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

// Debug configuration
interface DebugConfig {
  level: DebugLevel;
  enableConsole: boolean;
  enableSourceMaps: boolean;
  showTimestamps: boolean;
  showFileInfo: boolean;
}

// Default debug configuration
const defaultConfig: DebugConfig = {
  level:
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development'
      ? DebugLevel.DEBUG
      : DebugLevel.ERROR,
  enableConsole: true,
  enableSourceMaps: true,
  showTimestamps: true,
  showFileInfo: true,
};

// Debug class
class TypeScriptDebugger {
  private config: DebugConfig;
  private startTime: number;

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startTime = Date.now();
  }

  /**
   * Get current timestamp
   */
  private getTimestamp(): string {
    if (!this.config.showTimestamps) return '';
    const now = new Date();
    return `[${now.toISOString()}] `;
  }

  /**
   * Get file information for debugging
   */
  private getFileInfo(): string {
    if (!this.config.showFileInfo) return '';

    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const callerLine = lines[3] || lines[2]; // Skip Error constructor and getFileInfo
        if (callerLine) {
          const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
          if (match) {
            const [, , fileName, line, column] = match;
            const shortFileName = fileName
              ? fileName.split('/').pop() || fileName
              : 'unknown';
            return `[${shortFileName}:${line}:${column}] `;
          }
        }
      }
    } catch (error) {
      // Silently fail if we can't get file info
    }

    return '';
  }

  /**
   * Format debug message
   */
  private formatMessage(
    level: string,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = this.getTimestamp();
    const fileInfo = this.getFileInfo();
    const prefix = `${timestamp}${fileInfo}[${level}] `;

    if (args.length === 0) {
      return `${prefix}${message}`;
    }

    return `${prefix}${message} ${args
      .map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(' ')}`;
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.config.level >= DebugLevel.ERROR && this.config.enableConsole) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.level >= DebugLevel.WARN && this.config.enableConsole) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.level >= DebugLevel.INFO && this.config.enableConsole) {
      console.info(this.formatMessage('INFO', message, ...args));
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  /**
   * Log trace message
   */
  trace(message: string, ...args: unknown[]): void {
    if (this.config.level >= DebugLevel.TRACE && this.config.enableConsole) {
      console.trace(this.formatMessage('TRACE', message, ...args));
    }
  }

  /**
   * Log performance measurement
   */
  time(label: string): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.time(`[PERF] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }

  /**
   * Log object with better formatting
   */
  object(label: string, obj: unknown): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.group(`[OBJECT] ${label}`);
      console.dir(obj, { depth: null, colors: true });
      console.groupEnd();
    }
  }

  /**
   * Log table data
   */
  table(label: string, data: unknown[]): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.group(`[TABLE] ${label}`);
      console.table(data);
      console.groupEnd();
    }
  }

  /**
   * Log group of related messages
   */
  group(label: string): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.group(`[GROUP] ${label}`);
    }
  }

  groupEnd(): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      console.groupEnd();
    }
  }

  /**
   * Log memory usage
   */
  memory(): void {
    if (
      this.config.level >= DebugLevel.DEBUG &&
      this.config.enableConsole &&
      'memory' in performance
    ) {
      const mem = (performance as any).memory;
      this.info('Memory Usage:', {
        used: `${Math.round(mem.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(mem.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(mem.jsHeapSizeLimit / 1048576)} MB`,
      });
    }
  }

  /**
   * Log uptime
   */
  uptime(): void {
    if (this.config.level >= DebugLevel.DEBUG && this.config.enableConsole) {
      const uptime = Date.now() - this.startTime;
      const seconds = Math.floor(uptime / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      this.info('Uptime:', `${hours}h ${minutes % 60}m ${seconds % 60}s`);
    }
  }

  /**
   * Update debug configuration
   */
  updateConfig(newConfig: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current debug configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config };
  }
}

// Create and export default debugger instance
export const debug = new TypeScriptDebugger();

// Export debugger class for custom instances
export { TypeScriptDebugger };

// Utility functions for quick debugging
export const debugError = (message: string, ...args: unknown[]): void =>
  debug.error(message, ...args);
export const debugWarn = (message: string, ...args: unknown[]): void =>
  debug.warn(message, ...args);
export const debugInfo = (message: string, ...args: unknown[]): void =>
  debug.info(message, ...args);
export const debugLog = (message: string, ...args: unknown[]): void =>
  debug.debug(message, ...args);
export const debugTrace = (message: string, ...args: unknown[]): void =>
  debug.trace(message, ...args);

// Type-safe assertion function
export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (!condition) {
    const errorMessage = message || 'Assertion failed';
    debug.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Type-safe null check
export function assertNotNull<T>(
  value: T | null | undefined,
  message?: string
): T {
  assert(value != null, message || 'Value is null or undefined');
  return value;
}

// Performance measurement utility
export function measurePerformance<T>(label: string, fn: () => T): T {
  debug.time(label);
  try {
    const result = fn();
    debug.timeEnd(label);
    return result;
  } catch (error) {
    debug.timeEnd(label);
    throw error;
  }
}

// Async performance measurement utility
export async function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  debug.time(label);
  try {
    const result = await fn();
    debug.timeEnd(label);
    return result;
  } catch (error) {
    debug.timeEnd(label);
    throw error;
  }
}
