import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { NonProductionGuard } from '../../shared/guards/non-production.guard';
import { CacheEntry, CacheService } from './cache.service';

@Controller({ path: 'cache' })
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Search cached entries by a regular expression matched against keys.
   * `GET /cache?pattern=^user:` → array of matching `{ key, value }` entries.
   */
  @Version(VERSION_NEUTRAL)
  @UseGuards(NonProductionGuard)
  @Get()
  search(@Query('pattern') pattern: string): Promise<CacheEntry[]> {
    return this.cacheService.search(pattern);
  }

  /**
   * Delete a single cache entry by its exact key.
   * `DELETE /cache/:key` → `{ key, deleted }`.
   */
  @Version(VERSION_NEUTRAL)
  @UseGuards(NonProductionGuard)
  @Delete(':key')
  async remove(@Param('key') key: string): Promise<{ key: string; deleted: boolean }> {
    const deleted = await this.cacheService.delete(key);
    return { key, deleted };
  }
}
