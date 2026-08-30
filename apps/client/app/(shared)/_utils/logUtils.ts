export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LOG_LEVELS = Object.keys(LOG_LEVEL_SEVERITY) as LogLevel[];

export class LogUtils {
  private isLogLevel(value: string | undefined): value is LogLevel {
    return LOG_LEVELS.includes(value as LogLevel);
  }

  protected resolveLevel(): LogLevel {
    if (typeof window === 'undefined') {
      const level = process.env.LOG_LEVEL;
      return this.isLogLevel(level) ? level : 'debug';
    }

    return 'error';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] <= LOG_LEVEL_SEVERITY[this.resolveLevel()];
  }

  public error(...args: unknown[]): void {
    if (this.shouldLog('error')) console.error(...args);
  }

  public warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) console.warn(...args);
  }

  public info(...args: unknown[]): void {
    // eslint-disable-next-line no-console -- logUtils is the sanctioned console wrapper
    if (this.shouldLog('info')) console.info(...args);
  }

  public debug(...args: unknown[]): void {
    // eslint-disable-next-line no-console -- logUtils is the sanctioned console wrapper
    if (this.shouldLog('debug')) console.debug(...args);
  }
}

export const logUtils = new LogUtils();
