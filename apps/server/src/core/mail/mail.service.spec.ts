import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { MailService, SendMailOptions } from './mail.service';

jest.mock('nodemailer');

/** Build a `ConfigService` stub resolving keys from a plain lookup map. */
function createConfigService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

describe('MailService', () => {
  let sendMailMock: jest.Mock;
  let verifyMock: jest.Mock;
  let service: MailService;
  const defaultFrom = 'Default Sender <default@example.com>';

  beforeEach(() => {
    sendMailMock = jest.fn();
    verifyMock = jest.fn();
    jest
      .mocked(nodemailer.createTransport)
      .mockReturnValue({ sendMail: sendMailMock, verify: verifyMock } as unknown as ReturnType<
        typeof nodemailer.createTransport
      >);

    const config = createConfigService({
      'mail.host': 'smtp.example.com',
      'mail.port': 587,
      'mail.secure': true,
      'mail.user': 'user@example.com',
      'mail.password': 'secret',
      'mail.from': defaultFrom,
    });
    service = new MailService(config);
  });

  describe('send', () => {
    const baseOptions: SendMailOptions = {
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'plain body',
      html: '<p>html body</p>',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      replyTo: 'reply@example.com',
    };

    it('forwards the message fields to the transporter and defaults the sender when none is given', async () => {
      // Arrange
      sendMailMock.mockResolvedValue({ messageId: '1' });

      // Act
      await service.send(baseOptions);

      // Assert
      expect(sendMailMock).toHaveBeenCalledWith({
        from: defaultFrom,
        to: baseOptions.to,
        cc: baseOptions.cc,
        bcc: baseOptions.bcc,
        replyTo: baseOptions.replyTo,
        subject: baseOptions.subject,
        text: baseOptions.text,
        html: baseOptions.html,
      });
    });

    it('uses the explicit "from" option instead of the configured default', async () => {
      // Arrange
      sendMailMock.mockResolvedValue({ messageId: '1' });
      const explicitFrom = 'Explicit Sender <explicit@example.com>';

      // Act
      await service.send({ ...baseOptions, from: explicitFrom });

      // Assert
      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ from: explicitFrom }));
    });

    it('propagates a transport rejection', async () => {
      // Arrange
      const transportError = new Error('SMTP connection refused');
      sendMailMock.mockRejectedValue(transportError);

      // Act
      const act = service.send(baseOptions);

      // Assert
      await expect(act).rejects.toThrow(transportError);
    });
  });

  describe('verify', () => {
    it('delegates to the transporter verify method', async () => {
      // Arrange
      verifyMock.mockResolvedValue(true);

      // Act
      const result = await service.verify();

      // Assert
      expect(verifyMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
