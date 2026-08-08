import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * DTO carrying a single email address, e.g. for forgot-password or
 * subscribe endpoints.
 *
 * Usage: `@Body() { email }: EmailDto`
 */
export class EmailDto {
  @ApiProperty({
    format: 'email',
    example: 'user@example.com',
    description: 'A valid email address.',
  })
  @IsEmail()
  email!: string;
}
