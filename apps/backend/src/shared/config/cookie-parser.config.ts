import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

/**
 * Register the cookie-parser middleware so `request.cookies` is populated for
 * every request.
 *
 * When `COOKIE_SECRET` is configured (see `configuration.ts`), it is used to
 * sign cookies and expose the verified ones on `request.signedCookies`; left
 * empty, plain (unsigned) cookie parsing is still enabled. Apply early in
 * bootstrap so downstream handlers can read cookies.
 */
export function handleCookieParser(app: INestApplication): void {
  const secret = app.get(ConfigService).get<string>('cookie.secret');
  app.use(cookieParser(secret));
}
