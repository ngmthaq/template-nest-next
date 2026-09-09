import { Global, Module } from '@nestjs/common';

import { MailService } from './mail.service';

/** Provides {@link MailService} for transactional SMTP email. */
@Global()
@Module({
  imports: [],
  exports: [MailService],
  controllers: [],
  providers: [MailService],
})
export class MailModule {}
