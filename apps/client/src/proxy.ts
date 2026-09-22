import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import nextIntlProxy from '@/libs/next-intl/configs/proxy';
import { routing } from '@/libs/next-intl/configs/routing';
import { envUtils } from '@/shared/utils/envUtils';

const LOCALE_GROUP = routing.locales.join('|');
const CACHE_ROUTE_PATTERN = new RegExp(`^/(?:(?:${LOCALE_GROUP})/)?cache/?$`);

/** Matches only the cache explorer route: `/cache`, `/<locale>/cache`, with an optional trailing slash. */
export function isCacheRoute(pathname: string): boolean {
  return CACHE_ROUTE_PATTERN.test(pathname);
}

/** The request's locale segment, or the default locale when the path has none. */
function localeOf(pathname: string): string {
  const match = new RegExp(`^/(${LOCALE_GROUP})(?:/|$)`).exec(pathname);
  return match ? match[1] : routing.defaultLocale;
}

/**
 * Blocks the cache explorer in production before any route renders, so it 404s with a real
 * HTTP status (the page's own `notFound()` call runs too late to change the status code).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (envUtils.isProduction() && isCacheRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeOf(pathname)}/__not-found`;
    return NextResponse.rewrite(url);
  }

  return nextIntlProxy(request);
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
