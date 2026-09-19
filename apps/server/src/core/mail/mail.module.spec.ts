import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';

import { MailModule } from './mail.module';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest
      .mocked(nodemailer.createTransport)
      .mockReturnValue({ sendMail: jest.fn(), verify: jest.fn() } as unknown as ReturnType<
        typeof nodemailer.createTransport
      >);

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ mail: { host: 'localhost', port: 1025, secure: false } })],
        }),
        MailModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes MailService as an exported provider', () => {
    // Act
    const service = moduleRef.get(MailService);

    // Assert
    expect(service).toBeInstanceOf(MailService);
  });
});
