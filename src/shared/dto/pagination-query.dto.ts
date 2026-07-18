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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
