import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/** Numeric route id, e.g. `GET /users/:id`. Usage: `@Param() { id }: IdParamDto` */
export class IdParamDto {
  @ApiProperty({
    minimum: 1,
    example: 1,
    description: 'Positive integer resource identifier.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
