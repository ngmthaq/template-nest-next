import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Blocks the route whenever `nodeEnv` is production. Attach with `@UseGuards(NonProductionGuard)`
 * to anything that must never be reachable there, e.g. cache administration.
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
