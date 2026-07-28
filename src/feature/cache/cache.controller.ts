import { Controller, Delete, Get, Param, Query, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NonProductionGuard } from '../../shared/guards/non-production.guard';
import { CacheDeleteResult, CacheEntry, CacheService } from './cache.service';

@ApiTags('Cache')
@ApiForbiddenResponse({
  description: 'Not available in the production environment.',
})
@UseGuards(NonProductionGuard)
@Controller({ path: 'cache', version: VERSION_NEUTRAL })
export class CacheController {
  public constructor(private readonly cacheService: CacheService) {}

  /**
   * Search cached entries by a regular expression matched against keys.
   * `GET /cache?pattern=^user:` → array of matching `{ key, value }` entries.
   */
  @ApiOperation({
    summary: 'Search cached entries by key pattern',
  })
  @ApiQuery({
    name: 'pattern',
    required: true,
    description: 'Regular expression matched against cache keys.',
    example: '^user:',
  })
  @ApiOkResponse({
    description: 'Matching cache entries.',
    type: [CacheEntry],
  })
  @Get()
  public search(@Query('pattern') pattern: string): Promise<CacheEntry[]> {
    return this.cacheService.search(pattern);
  }

  /**
   * Delete a single cache entry by its exact key.
   * `DELETE /cache/:key` → `{ key, deleted }`.
   */
  @ApiOperation({
    summary: 'Delete a cache entry by exact key',
  })
  @ApiParam({
    name: 'key',
    description: 'Exact cache key to delete.',
    example: 'user:42',
  })
  @ApiOkResponse({
    description: 'Deletion result.',
    type: CacheDeleteResult,
  })
  @Delete(':key')
  public async remove(@Param('key') key: string): Promise<CacheDeleteResult> {
    const deleted = await this.cacheService.delete(key);
    return { key, deleted };
  }
}
