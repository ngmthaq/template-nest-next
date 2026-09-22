export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** One log entry shipped to OpenObserve, matching the shape the server sends. */
export interface OpenObserveLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: 'client';
  env: string;
}

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LOG_LEVELS = Object.keys(LOG_LEVEL_SEVERITY) as LogLevel[];
const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;

export class LogUtils {
  private batch: OpenObserveLogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | undefined;

  public error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...args);
      this.enqueue('error', args);
    }
  }

  public warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
      this.enqueue('warn', args);
    }
  }

  public info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console -- logUtils is the sanctioned console wrapper
      console.info(...args);
      this.enqueue('info', args);
    }
  }

  public debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console -- logUtils is the sanctioned console wrapper
      console.debug(...args);
      this.enqueue('debug', args);
    }
  }

  protected resolveLevel(): LogLevel {
    if (typeof window === 'undefined') {
      const level = process.env.LOG_LEVEL;
      return this.isLogLevel(level) ? level : 'debug';
    }

    return 'error';
  }

  /** Queues an entry for OpenObserve. No-op in the browser or when `OPENOBSERVE_URL` is unset. */
  protected enqueue(level: LogLevel, args: unknown[]): void {
    if (typeof window !== 'undefined' || !process.env.OPENOBSERVE_URL) return;

    this.batch.push({
      timestamp: new Date().toISOString(),
      level,
      message: this.stringifyArgs(args),
      service: 'client',
      env: process.env.APP_ENV ?? 'development',
    });

    if (this.batch.length >= MAX_BATCH_SIZE) {
      this.flush();
      return;
    }

    this.scheduleFlush();
  }

  /** Starts the flush timer, `unref`-ed so a pending batch never blocks the process exiting. */
  protected scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    if (typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
      this.flushTimer.unref();
    }
  }

  protected flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.batch.length === 0) return;

    const entries = this.batch;
    this.batch = [];
    void this.send(entries);
  }

  /** Fire-and-forget POST to OpenObserve's `_json` ingest endpoint. Never throws. */
  protected async send(entries: OpenObserveLogEntry[]): Promise<void> {
    const url = process.env.OPENOBSERVE_URL;
    if (!url) return;

    const org = process.env.OPENOBSERVE_ORG ?? 'default';
    const stream = process.env.OPENOBSERVE_STREAM ?? 'client';
    const user = process.env.OPENOBSERVE_USER;
    const password = process.env.OPENOBSERVE_PASSWORD ?? '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user) headers.Authorization = `Basic ${btoa(`${user}:${password}`)}`;

    try {
      await fetch(`${url.replace(/\/+$/, '')}/api/${org}/${stream}/_json`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entries),
      });
    } catch {
      // Swallowed on purpose: a failed send must never crash the app or log through
      // logUtils, which would loop back into this same send path.
    }
  }

  private stringifyArgs(args: unknown[]): string {
    return args.map((arg) => this.stringifyArg(arg)).join(' ');
  }

  private stringifyArg(arg: unknown): string {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack ?? arg.message;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  private isLogLevel(value: string | undefined): value is LogLevel {
    return LOG_LEVELS.includes(value as LogLevel);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] <= LOG_LEVEL_SEVERITY[this.resolveLevel()];
  }
}

export const logUtils = new LogUtils();
