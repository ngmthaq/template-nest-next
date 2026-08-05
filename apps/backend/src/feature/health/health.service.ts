import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { Redis } from 'ioredis';
import type { Pool } from 'mysql2/promise';
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
    },
    description: 'Per-dependency status, keyed by indicator name.',
  })
  info!: Record<string, IndicatorStatus>;
}

/**
 * Probes the app's own liveness plus its backing services (MySQL, Redis) and
 * aggregates them into a single {@link HealthResult}. Each dependency is
 * checked with a cheap, well-bounded query (`SELECT 1` / `PING`) so a hung or
 * unreachable service surfaces as `down` rather than blocking the request.
 *
 * The MySQL pool and Redis client are owned by this service and closed on
 * shutdown (see {@link onModuleDestroy}).
 */
@Injectable()
export class HealthService implements OnModuleDestroy {
  public constructor(
    @Inject(HEALTH_MYSQL_POOL) private readonly mysql: Pool,
    @Inject(HEALTH_REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Run every indicator in parallel and fold them into one report. */
  public async check(): Promise<HealthResult> {
    const [mysql, redis] = await Promise.all([this.checkMysql(), this.checkRedis()]);
    const info: Record<string, IndicatorStatus> = {
      server: { status: 'up', uptime: process.uptime() },
      mysql,
      redis,
    };
    const healthy = Object.values(info).every((indicator) => indicator.status === 'up');
    return { status: healthy ? 'ok' : 'error', info };
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

  /** Release both connections when the app shuts down. */
  public async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.mysql.end(), this.redis.quit()]);
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
