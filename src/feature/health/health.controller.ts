import {
  Controller,
  Get,
  ServiceUnavailableException,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResult, HealthService } from './health.service';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness/readiness probe. Reports the app plus its backing services
   * (MySQL, Redis). Responds `200` when everything is up, `503` otherwise —
   * either way the body is the full per-service {@link HealthResult}.
   */
  @ApiOperation({
    summary: 'Health check (server, MySQL, Redis)',
  })
  @ApiOkResponse({
    description: 'All dependencies are up.',
    type: HealthResult,
  })
  @ApiServiceUnavailableResponse({
    description: 'At least one dependency is down.',
    type: HealthResult,
  })
  @Version(VERSION_NEUTRAL)
  @Get()
  public async check(): Promise<HealthResult> {
    const result = await this.healthService.check();
    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
