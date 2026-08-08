import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query-param DTO for paginated list endpoints, e.g. `GET /users?page=2&limit=20`.
 *
 * Both fields are optional and fall back to sensible defaults. `limit` is
 * capped to protect the backend from oversized page requests.
 *
 * Usage: `@Query() { page, limit }: PaginationQueryDto`
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Page number (1-based).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page (max 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
