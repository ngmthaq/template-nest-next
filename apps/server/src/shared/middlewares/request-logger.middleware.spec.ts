import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';

import { RequestLoggerMiddleware } from './request-logger.middleware';

type MockResponse = EventEmitter & { statusCode: number };
type LogLevel = 'log' | 'warn' | 'error';
type LoggerSpies = Record<LogLevel, jest.SpyInstance>;

interface RequestOptions {
  userAgent?: string;
  originalUrl?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

const createRequest = (options: RequestOptions = {}): Request => {
  const { userAgent, originalUrl = '/health', query = {}, body } = options;
  return {
    method: 'GET',
    originalUrl,
    ip: '::1',
    query,
    body,
    get: jest.fn((header: string) => (header === 'user-agent' ? userAgent : undefined)),
  } as unknown as Request;
};

const createResponse = (statusCode: number): MockResponse => {
  const response = new EventEmitter() as MockResponse;
  response.statusCode = statusCode;
  return response;
};

const createMiddleware = (
  requestData: boolean,
): { middleware: RequestLoggerMiddleware; configGet: jest.Mock } => {
  const configGet = jest.fn().mockReturnValue(requestData);
  const config = { get: configGet } as unknown as ConfigService;
  return { middleware: new RequestLoggerMiddleware(config), configGet };
};

const mockDuration = (durationMs: number): void => {
  jest
    .spyOn(Date, 'now')
    .mockReturnValueOnce(1_000)
    .mockReturnValueOnce(1_000 + durationMs);
};

describe('RequestLoggerMiddleware', () => {
  let next: NextFunction;
  let spies: LoggerSpies;

  beforeEach(() => {
    next = jest.fn();
    spies = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      warn: jest.spyOn(Logger.prototype, 'warn').mockImplementation(),
      error: jest.spyOn(Logger.prototype, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the log.requestData flag from config with a false default', () => {
    // Arrange
    const configGet = jest.fn().mockReturnValue(false);
    const config = { get: configGet } as unknown as ConfigService;

    // Act
    new RequestLoggerMiddleware(config);

    // Assert
    expect(configGet).toHaveBeenCalledWith('log.requestData', false);
  });

  it('calls next once', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({ userAgent: 'jest-agent' });
    const res = createResponse(200);

    // Act
    middleware.use(req, res as unknown as Response, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not log before the response finish event fires', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({ userAgent: 'jest-agent' });
    const res = createResponse(200);

    // Act
    middleware.use(req, res as unknown as Response, next);

    // Assert
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });

  it('logs "-" as the user agent when the header is missing', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({});
    const res = createResponse(200);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(expect.stringContaining('"-"'));
  });

  it.each([
    [199, 'log'],
    [399, 'log'],
    [400, 'warn'],
    [499, 'warn'],
    [500, 'error'],
    [599, 'error'],
  ] as const)('logs status %i at the %s level only', (statusCode, level: LogLevel) => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({ userAgent: 'jest-agent' });
    const res = createResponse(statusCode);
    const otherLevels = (['log', 'warn', 'error'] as const).filter(
      (candidate) => candidate !== level,
    );

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    for (const otherLevel of otherLevels) {
      expect(spies[otherLevel]).not.toHaveBeenCalled();
    }
    expect(spies[level]).toHaveBeenCalledTimes(1);
  });

  it('warns exactly once on a 404 response', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({ userAgent: 'jest-agent' });
    const res = createResponse(404);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });

  it('errors exactly once on a 500 response', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({ userAgent: 'jest-agent' });
    const res = createResponse(500);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.error).toHaveBeenCalledTimes(1);
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
  });

  it('logs the path without the query string and without request data when the flag is off', () => {
    // Arrange
    const { middleware } = createMiddleware(false);
    const req = createRequest({
      userAgent: 'jest-agent',
      originalUrl: '/health?x=1',
      query: { x: '1' },
      body: { name: 'a' },
    });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith('GET /health 200 12ms - ::1 "jest-agent"');
  });

  it('adds masked query and body JSON to the line when the flag is on', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({
      userAgent: 'jest-agent',
      originalUrl: '/health?x=1',
      query: { x: '1' },
      body: { name: 'a' },
    });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /health 200 12ms - ::1 "jest-agent" query={"x":"1"} body={"name":"a"}',
    );
  });

  it('adds no suffix when the flag is on but query and body are both empty', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({ userAgent: 'jest-agent', query: {} });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith('GET /health 200 12ms - ::1 "jest-agent"');
  });

  it('adds only the body suffix when the query is empty and the body is not', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({ userAgent: 'jest-agent', query: {}, body: { name: 'a' } });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /health 200 12ms - ::1 "jest-agent" body={"name":"a"}',
    );
  });

  it('masks secret keys in nested objects and arrays, but keeps other fields', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const body = {
      user: { apiKey: 'k' },
      items: [{ accessToken: 't' }],
      password: 'p',
      name: 'a',
    };
    const req = createRequest({ userAgent: 'jest-agent', query: {}, body });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /health 200 12ms - ::1 "jest-agent" ' +
        'body={"user":{"apiKey":"***"},"items":[{"accessToken":"***"}],"password":"***","name":"a"}',
    );
  });

  it('masks a secret key regardless of letter case', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({
      userAgent: 'jest-agent',
      query: {},
      body: { Authorization: 'Bearer xyz' },
    });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /health 200 12ms - ::1 "jest-agent" body={"Authorization":"***"}',
    );
  });

  it('masks secret keys in the query as well as the body', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({
      userAgent: 'jest-agent',
      originalUrl: '/health?token=abc',
      query: { token: 'abc' },
    });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /health 200 12ms - ::1 "jest-agent" query={"token":"***"}',
    );
  });

  it('masks otp and captcha keys in the query and the body, and keeps normal keys', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const req = createRequest({
      userAgent: 'jest-agent',
      originalUrl: '/verify?otpCode=123456',
      query: { otpCode: '123456' },
      body: { recaptchaResponse: 'r', otpCode: '1', name: 'a' },
    });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      'GET /verify 200 12ms - ::1 "jest-agent" query={"otpCode":"***"} ' +
        'body={"recaptchaResponse":"***","otpCode":"***","name":"a"}',
    );
  });

  it('does not change the original request body while masking it', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const body = { user: { apiKey: 'k' }, password: 'p', name: 'a' };
    const bodyBeforeCall = JSON.parse(JSON.stringify(body)) as typeof body;
    const req = createRequest({ userAgent: 'jest-agent', query: {}, body });
    const res = createResponse(200);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(req.body).toEqual(bodyBeforeCall);
  });

  it('cuts the body JSON at 2000 characters and adds the truncated marker', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    const body = { name: 'a'.repeat(2500) };
    const expectedBodyText = `${JSON.stringify(body).slice(0, 2000)}…(truncated)`;
    const req = createRequest({ userAgent: 'jest-agent', query: {}, body });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(spies.log).toHaveBeenCalledWith(
      `GET /health 200 12ms - ::1 "jest-agent" body=${expectedBodyText}`,
    );
  });

  it('does not cut the body JSON when it is exactly at the 2000 character limit', () => {
    // Arrange
    const { middleware } = createMiddleware(true);
    // '{"name":""}' is 11 characters, so a 1989-character value makes the JSON exactly 2000.
    const body = { name: 'a'.repeat(1989) };
    const expectedJson = JSON.stringify(body);
    const req = createRequest({ userAgent: 'jest-agent', query: {}, body });
    const res = createResponse(200);
    mockDuration(12);

    // Act
    middleware.use(req, res as unknown as Response, next);
    res.emit('finish');

    // Assert
    expect(expectedJson).toHaveLength(2000);
    expect(spies.log).toHaveBeenCalledWith(
      `GET /health 200 12ms - ::1 "jest-agent" body=${expectedJson}`,
    );
  });
});
