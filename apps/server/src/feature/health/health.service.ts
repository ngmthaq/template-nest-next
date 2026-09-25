import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Redis } from 'ioredis';
import type { Pool } from 'mysql2/promise';
import { firstValueFrom } from 'rxjs';

import { PyServiceHealthDto } from './dto/py-service-health.dto';
import { HEALTH_MYSQL_POOL, HEALTH_REDIS_CLIENT } from './health.constants';

/** Liveness result for a single dependency. */
export class IndicatorStatus {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status!: 'up' | 'down';

  @ApiProperty({
    required: false,
    example: 'connect ECONNREFUSED 127.0.0.1:3306',
    description: 'Present only when `status` is `down`.',
  })
  error?: string;

  @ApiProperty({
    required: false,
    example: 123.45,
    description: 'Process uptime in seconds (server indicator only).',
  })
  uptime?: number;
}

/** Aggregated health report across every checked dependency. */
export class HealthResult {
  @ApiProperty({
    enum: ['ok', 'error'],
    example: 'ok',
    description: '`ok` when every indicator is up, otherwise `error`.',
  })
  status!: 'ok' | 'error';

  @ApiProperty({
    type: IndicatorStatus,
    additionalProperties: { $ref: '#/components/schemas/IndicatorStatus' },
    example: {
      server: { status: 'up', uptime: 123.45 },
      mysql: { status: 'up' },
      redis: { status: 'up' },
      pyService: { status: 'up' },
    },
    description: 'Per-dependency status, keyed by indicator name.',
  })
  info!: Record<string, IndicatorStatus>;
}

/**
 * Probes the app plus MySQL and Redis, each with a cheap bounded query (`SELECT 1` / `PING`)
 * so a hung service reports `down` instead of blocking. Owns both connections and closes them.
 */
@Injectable()
export class HealthService implements OnModuleDestroy {
  public constructor(
    @Inject(HEALTH_MYSQL_POOL) private readonly mysql: Pool,
    @Inject(HEALTH_REDIS_CLIENT) private readonly redis: Redis,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /** Run every indicator in parallel and fold them into one report. */
  public async check(): Promise<HealthResult> {
    const pyServiceUrl = this.config.get<string>('pyService.url');
    const [mysql, redis, pyService] = await Promise.all([
      this.checkMysql(),
      this.checkRedis(),
      pyServiceUrl ? this.checkPyService(pyServiceUrl) : undefined,
    ]);
    const info: Record<string, IndicatorStatus> = {
      server: { status: 'up', uptime: process.uptime() },
      mysql,
      redis,
      ...(pyService ? { pyService } : {}),
    };
    const healthy = Object.values(info).every((indicator) => indicator.status === 'up');
    return { status: healthy ? 'ok' : 'error', info };
  }

  /** Release both connections on shutdown. */
  public async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.mysql.end(), this.redis.quit()]);
  }

  /** `SELECT 1` against the MySQL pool. */
  private async checkMysql(): Promise<IndicatorStatus> {
    try {
      await this.mysql.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: this.messageOf(error) };
    }
  }

  /** `PING` against Redis; a resolved reply means the connection is live. */
  private async checkRedis(): Promise<IndicatorStatus> {
    try {
      await this.redis.ping();
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: this.messageOf(error) };
    }
  }

  /** `GET {url}/health` on py-service, validating the body against {@link PyServiceHealthDto}. */
  private async checkPyService(url: string): Promise<IndicatorStatus> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`${url}/health`, { timeout: 3000 }),
      );
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { status: 'down', error: 'Invalid py-service health response' };
      }
      const dto = plainToInstance(PyServiceHealthDto, data);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const properties = errors.map((error) => error.property).join(', ');
        return { status: 'down', error: `Invalid py-service health response: ${properties}` };
      }
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: this.messageOf(error) };
    }
  }

  private messageOf(error: unknown): string {
    // Node's happy-eyeballs wraps connection failures in an AggregateError
    // whose own message is empty — unwrap to the first underlying cause.
    if (error instanceof AggregateError && error.errors.length > 0) {
      return this.messageOf(error.errors[0]);
    }
    if (error instanceof Error) {
      const code = (error as NodeJS.ErrnoException).code;
      return error.message || code || error.name;
    }
    return String(error);
  }
}
