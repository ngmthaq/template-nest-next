import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

/**
 * Logs one line per HTTP request through the global Winston logger, once the response
 * finishes. Applied to every route in `AppModule`, so it also covers 404s and rejections.
 * When `LOG_REQUEST_DATA=true`, the line also gets masked, size-limited query and body JSON.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private static readonly MAX_JSON_LENGTH = 2000;
  private static readonly TRUNCATED_SUFFIX = '…(truncated)';
  private static readonly SECRET_KEY_WORDS = [
    'password',
    'token',
    'secret',
    'authorization',
    'apikey',
    'otp',
    'captcha',
  ];

  private readonly logger = new Logger(RequestLoggerMiddleware.name);
  private readonly logRequestData: boolean;

  /**
   * Reads the `log.requestData` flag once, so the per-request logging logic never re-reads config.
   */
  public constructor(private readonly config: ConfigService) {
    this.logRequestData = this.config.get<boolean>('log.requestData', false);
  }

  /**
   * Records the start time, then logs the request line when the response `finish` event fires.
   */
  public use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const message = this.buildMessage(req, res, duration);
      this.logByStatus(res.statusCode, message);
    });

    next();
  }

  private buildMessage(req: Request, res: Response, duration: number): string {
    const path = req.originalUrl.split('?')[0];
    const userAgent = req.get('user-agent') ?? '-';
    const base = `${req.method} ${path} ${res.statusCode} ${duration}ms - ${req.ip} "${userAgent}"`;

    return this.logRequestData ? base + this.buildRequestDataSuffix(req) : base;
  }

  private buildRequestDataSuffix(req: Request): string {
    const query = this.stringifyIfNotEmpty(req.query);
    const body = this.stringifyIfNotEmpty(req.body as unknown);
    const parts: string[] = [];

    if (query) {
      parts.push(`query=${query}`);
    }
    if (body) {
      parts.push(`body=${body}`);
    }

    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  private stringifyIfNotEmpty(value: unknown): string | undefined {
    if (this.isEmpty(value)) {
      return undefined;
    }

    const json = JSON.stringify(this.maskValue(value));
    return json.length > RequestLoggerMiddleware.MAX_JSON_LENGTH
      ? json.slice(0, RequestLoggerMiddleware.MAX_JSON_LENGTH) +
          RequestLoggerMiddleware.TRUNCATED_SUFFIX
      : json;
  }

  private isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  private maskValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskValue(item));
    }
    if (value !== null && typeof value === 'object') {
      return this.maskObject(value as Record<string, unknown>);
    }
    return value;
  }

  private maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      masked[key] = this.isSecretKey(key) ? '***' : this.maskValue(value);
    }
    return masked;
  }

  private isSecretKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return RequestLoggerMiddleware.SECRET_KEY_WORDS.some((word) => lowerKey.includes(word));
  }

  private logByStatus(statusCode: number, message: string): void {
    if (statusCode >= 500) {
      this.logger.error(message);
    } else if (statusCode >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }
}
