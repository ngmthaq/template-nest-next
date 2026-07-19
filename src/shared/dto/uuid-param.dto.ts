import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Route-param DTO for a UUID resource id, e.g. `GET /users/:id`.
 *
 * Usage: `@Param() { id }: UuidParamDto`
 */
export class UuidParamDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Resource identifier (UUID).',
  })
  @IsUUID()
  id!: string;
}
