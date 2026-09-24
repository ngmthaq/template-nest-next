import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Blocks the route whenever `appEnv` is production. Attach with `@UseGuards(NonProductionGuard)`
 * to anything that must never be reachable there, e.g. cache administration.
 */
@Injectable()
export class NonProductionGuard implements CanActivate {
  public constructor(private readonly config: ConfigService) {}

  public canActivate(): boolean {
    const appEnv = this.config.get<string>('appEnv', 'development');
    if (appEnv === 'production') {
      throw new ForbiddenException('This endpoint is not available in the production environment.');
    }
    return true;
  }
}
