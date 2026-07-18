import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Blocks access whenever the application runs in the production environment.
 *
 * Attach with `@UseGuards(NonProductionGuard)` to routes that must never be
 * reachable in production — e.g. cache inspection/administration endpoints.
 * The active environment is read from `ConfigService` (`nodeEnv`).
 */
@Injectable()
export class NonProductionGuard implements CanActivate {
  public constructor(private readonly config: ConfigService) {}

  public canActivate(): boolean {
    const nodeEnv = this.config.get<string>('nodeEnv', 'development');
    if (nodeEnv === 'production') {
      throw new ForbiddenException('This endpoint is not available in the production environment.');
    }
    return true;
  }
}
