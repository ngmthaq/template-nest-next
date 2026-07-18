import { IsEmail } from 'class-validator';

/**
 * DTO carrying a single email address, e.g. for forgot-password or
 * subscribe endpoints.
 *
 * Usage: `@Body() { email }: EmailDto`
 */
export class EmailDto {
  @IsEmail()
  email!: string;
}
