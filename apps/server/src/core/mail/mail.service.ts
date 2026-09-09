import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/** Options for {@link MailService.send} — a thin projection of nodemailer's message fields. */
export interface SendMailOptions {
  /** Recipient address(es). */
  to: string | string[];

  /** Message subject line. */
  subject: string;

  /** Plaintext body. Provide this and/or {@link html}. */
  text?: string;

  /** HTML body. Provide this and/or {@link text}. */
  html?: string;

  /** Overrides the configured default sender for this message. */
  from?: string;

  /** Carbon-copy address(es). */
  cc?: string | string[];

  /** Blind carbon-copy address(es). */
  bcc?: string | string[];

  /** Reply-To address(es). */
  replyTo?: string | string[];
}

/**
 * Sends transactional email over SMTP via a pooled nodemailer transporter.
 * Point it at a real provider in production, or a local catcher (Mailpit) in dev.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly defaultFrom: string;

  public constructor(config: ConfigService) {
    const user = config.get<string>('mail.user');
    const pass = config.get<string>('mail.password');
    this.defaultFrom = config.get<string>('mail.from', 'No Reply <no-reply@example.com>');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('mail.host', 'localhost'),
      port: config.get<number>('mail.port', 1025),
      secure: config.get<boolean>('mail.secure', false),
      auth: user ? { user, pass } : undefined,
    });
  }

  /** Send an email, applying the default sender when none is given. Rejects if the transport fails. */
  public async send(options: SendMailOptions): Promise<SMTPTransport.SentMessageInfo> {
    const info = await this.transporter.sendMail({
      from: options.from ?? this.defaultFrom,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    this.logger.debug(`Email sent to ${String(options.to)}: ${info.messageId}`);
    return info;
  }

  /** Verify the SMTP connection and credentials without sending anything. */
  public verify(): Promise<true> {
    return this.transporter.verify();
  }
}
