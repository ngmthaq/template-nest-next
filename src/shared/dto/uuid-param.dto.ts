import { IsUUID } from 'class-validator';

/**
 * Route-param DTO for a UUID resource id, e.g. `GET /users/:id`.
 *
 * Usage: `@Param() { id }: UuidParamDto`
 */
export class UuidParamDto {
  @IsUUID()
  id!: string;
}
