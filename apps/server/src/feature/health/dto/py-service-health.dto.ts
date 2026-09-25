import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Expected shape of py-service's `GET /health` response body. */
export class PyServiceHealthDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  @IsIn(['ok'])
  status!: 'ok';
}
