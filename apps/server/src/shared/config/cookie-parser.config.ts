import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

/**
 * Populate `request.cookies` on every request. With `COOKIE_SECRET` set, cookies are also
 * signed and the verified ones exposed on `request.signedCookies`.
 */
export function handleCookieParser(app: INestApplication): void {
  const secret = app.get(ConfigService).get<string>('cookie.secret');
  app.use(cookieParser(secret));
}
