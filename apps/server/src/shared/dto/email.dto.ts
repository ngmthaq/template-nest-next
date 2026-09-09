import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/** A single email address, e.g. forgot-password or subscribe. Usage: `@Body() { email }: EmailDto` */
export class EmailDto {
  @ApiProperty({
    format: 'email',
    example: 'user@example.com',
    description: 'A valid email address.',
  })
  @IsEmail()
  email!: string;
}
