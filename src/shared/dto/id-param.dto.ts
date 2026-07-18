import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Route-param DTO for a numeric resource id, e.g. `GET /users/:id`.
 *
 * Usage: `@Param() { id }: IdParamDto`
 */
export class IdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
