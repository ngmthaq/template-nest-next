import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Provides the application's {@link MailService} for sending transactional
 * email over SMTP (nodemailer). Its transport settings are resolved from
 * `ConfigService`; see `configuration.ts`.
 *
 * Marked `@Global` so `MailService` can be injected anywhere without
 * re-importing, matching the app-wide availability of the other core
 * infrastructure.
 */
@Global()
@Module({
  imports: [],
  exports: [MailService],
  controllers: [],
  providers: [MailService],
})
export class MailModule {}
