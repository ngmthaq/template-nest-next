# @template-nest-next/client

The [Next.js](https://nextjs.org) front-end of the monorepo, talking to the NestJS API in
[apps/server](../server/README.md).

## Getting started

```bash
pnpm install         # from the repo root

pnpm start:dev       # dev server (APP_ENV=development)
pnpm start:debug     # dev server with the Node inspector
pnpm build           # production build
pnpm start:staging   # serve the build with APP_ENV=staging
pnpm start:prod      # serve the build with APP_ENV=production

pnpm lint            # eslint --fix
pnpm format          # prettier --write
```

From the repo root, `pnpm client <script>` proxies to any of these.

Copy `.env.example` to `.env.development` (or `.env.<APP_ENV>.local` for secrets) and set at least:

| Variable              | Used for                                                     |
| --------------------- | ------------------------------------------------------------ |
| `PORT`                | Port the Next server listens on — read by `load-env-cli.mjs` |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, including its `/api` prefix             |

Files load in the order `.env.<APP_ENV>.local` → `.env.<APP_ENV>` → `.env`, first match wins (see
`load-env.mjs`).

## Structure

```
proxy.ts                   # Locale negotiation, delegates to _i18n/proxy
app/
├── (routes)/              # Route group holding the actual pages
│   └── [locale]/          # Every page lives under a locale segment
└── (shared)/              # Not routable — shared building blocks
    ├── _components/       # Shared React components
    ├── _i18n/             # next-intl routing, navigation, messages
    ├── _schemas/          # Shared types / validation schemas
    ├── _services/         # httpService, cookieService, cacheService
    ├── _theme/            # globals.css, fonts and theme tokens
    └── _utils/            # Helpers
```

`@/*` maps to the app root, so `@/app/(shared)/_services` resolves from anywhere.

## Services

Three services live in `app/(shared)/_services`. Each exports both its class and a ready-made
singleton — use the singleton unless you need different construction options.

```ts
import { cookieService, httpService } from '@/app/(shared)/_services';

import { cacheService } from '@/app/(shared)/_services/cacheService';
```

`cacheService` is deliberately **not** in the barrel: it imports `next/cache` and is server-only, so
re-exporting it would break every Client Component that imports from `_services`.

### httpService

A `fetch` wrapper that prefixes `NEXT_PUBLIC_API_URL`, attaches the access token, parses JSON, throws
on non-2xx, and times out after 60s. It runs on the server and in the browser.

#### Requests

```ts
import { httpService } from '@/app/(shared)/_services';

// GET /items?page=2&sort=name
const items = await httpService.get<Item[]>('/items', { page: '2', sort: 'name' });

const item = await httpService.post<Item>('/items', { name: 'Chair', price: 40 });
const replaced = await httpService.put<Item>('/items/1', { name: 'Chair', price: 45 });
const patched = await httpService.patch<Item>('/items/1', { price: 50 });

// DELETE takes query params, not a body
await httpService.delete<void>('/items/1');
await httpService.delete<void>('/items', { ids: '1,2,3' });
```

`get`/`delete` take `Record<string, string>` query params, which are merged into any query string
already present on the URL. `post`/`put`/`patch` JSON-encode the body and set `Content-Type:
application/json` unless you set it yourself.

For uploads use the `*FormData` variants — they leave `Content-Type` alone so the browser can add the
multipart boundary:

```ts
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Avatar');

await httpService.postFormData<Upload>('/uploads', formData);
await httpService.putFormData<Upload>('/uploads/1', formData);
await httpService.patchFormData<Upload>('/uploads/1', formData);
```

Every method takes a final options argument that extends `RequestInit`, so anything `fetch` accepts
works, plus `withAuth` and `cookies`:

```ts
// Public endpoint — skip the cookie read entirely
await httpService.get<Health>('/health', undefined, { withAuth: false });

// Custom headers, plus a Next fetch option
await httpService.get<Item[]>('/items', undefined, {
  headers: { 'Accept-Language': 'vi' },
  cache: 'no-store',
});
```

#### Errors

Failures arrive as two named error classes, both exported from the service:

```ts
import {
  httpService,
  HttpServiceResponseError,
  HttpServiceTimeoutError,
} from '@/app/(shared)/_services';

try {
  await httpService.post('/auth/login', { email, password });
} catch (error) {
  if (error instanceof HttpServiceResponseError) {
    // error.status -> 401, error.body -> parsed JSON error payload from the API
    if (error.status === 401) return { message: 'Wrong email or password' };
  }
  if (error instanceof HttpServiceTimeoutError) {
    return { message: 'The server took too long to respond' };
  }
  throw error;
}
```

`error.body` is the parsed JSON when the response is JSON, the raw text when it is not, and
`undefined` for an empty body.

#### Cancellation and timeouts

Pass your own `signal` and it is honoured alongside the internal timeout — whichever aborts first
wins:

```ts
const controller = new AbortController();
const promise = httpService.get<Item[]>('/items', undefined, { signal: controller.signal });
controller.abort();
```

To change the 60s default or point at another API, construct your own instance:

```ts
import { HttpService } from '@/app/(shared)/_services';

export const reportService = new HttpService({
  baseUrl: process.env.REPORTS_API_URL,
  timeout: 5 * 60 * 1000,
});
```

#### Tokens

The service owns the `access_token` / `refresh_token` cookies and delegates storage to
`cookieService`. Cookies are written with `path: '/'`, `sameSite: 'strict'`, and `secure` in
production; pass options to override per call.

```ts
'use server';

import { httpService } from '@/app/(shared)/_services';

export async function login(email: string, password: string) {
  const tokens = await httpService.post<{ accessToken: string; refreshToken: string }>(
    '/auth/login',
    { email, password },
    { withAuth: false },
  );

  await httpService.setAccessToken(tokens.accessToken, { maxAge: 60 * 15 });
  await httpService.setRefreshToken(tokens.refreshToken, { maxAge: 60 * 60 * 24 * 7 });
}

export async function logout() {
  await httpService.removeAccessToken();
  await httpService.removeRefreshToken();
}
```

Each request reads `getAccessToken()` and sets `Authorization: Bearer <token>` — but only when
`withAuth` is left on **and** no `Authorization` header was supplied. Setting the header yourself
takes precedence and skips the cookie read, which is what makes caching authenticated endpoints
possible (see [Caching](#caching-and-revalidation)).

On the server the cookie store is resolved for you, so `cookies` is rarely needed. Pass it when you
want the read to be explicit — or when you already hold the store and want to avoid the dynamic
`next/headers` import:

```ts
import { cookies } from 'next/headers';

const items = await httpService.get<Item[]>('/items', undefined, { cookies });
```

`HttpServiceRequestOptions` accepts only `cookies` (a `CookiesFn`), not `req`/`res`. Middleware,
which has no `next/headers` store, is therefore a place to build the header yourself:

```ts
const token = await cookieService.get('access_token', { req, res });
await httpService.get<Item[]>('/items', undefined, {
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});
```

### cookieService

A thin wrapper over [`cookies-next`](https://github.com/andreizanik/cookies-next) with one job: the
same call works on the server and in the browser. On the server it lazily imports `next/headers` and
injects `cookies` for you, unless you already passed a `req`/`res`/`cookies` scope.

```ts
import { cookieService } from '@/app/(shared)/_services';

await cookieService.set('locale', 'vi', { maxAge: 60 * 60 * 24 * 365, path: '/' });
const locale = await cookieService.get('locale'); // string | undefined

await cookieService.has('locale'); // boolean
await cookieService.remove('locale', { path: '/' });
await cookieService.getAll(); // { locale: 'vi', access_token: '…' }
```

Objects round-trip through the JSON helpers. `getJson` returns `undefined` rather than throwing when
the cookie is missing or is not valid JSON:

```ts
type Prefs = { theme: 'light' | 'dark'; sidebar: boolean };

await cookieService.setJson<Prefs>('prefs', { theme: 'dark', sidebar: true });
const prefs = (await cookieService.getJson<Prefs>('prefs')) ?? { theme: 'light', sidebar: false };
```

Every method is `async` even in the browser, because the server path awaits `next/headers`. In a
Client Component that means reading cookies inside an effect or an event handler:

```tsx
'use client';

import { useEffect, useState } from 'react';

import { cookieService } from '@/app/(shared)/_services';

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>();

  useEffect(() => {
    cookieService.get('theme').then(setTheme);
  }, []);

  async function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    await cookieService.set('theme', next, { path: '/' });
    setTheme(next);
  }

  return <button onClick={toggle}>{theme ?? '…'}</button>;
}
```

Writing a cookie during a Server Component render throws — Next only allows it in Server Actions,
Route Handlers, and Middleware. Reading is fine anywhere on the server. In Middleware, pass the scope
explicitly:

```ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { cookieService } from '@/app/(shared)/_services';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!(await cookieService.has('session_id', { req, res }))) {
    await cookieService.set('session_id', crypto.randomUUID(), { req, res, path: '/' });
  }
  return res;
}
```

### cacheService

See the next section — it is the whole caching story for this app.

## Internationalization

[next-intl](https://next-intl.dev) with locale-prefixed URLs. `en` is the only locale today, so `/`
redirects to `/en` and every route lives under `/en/…`.

```
app/(shared)/_i18n/
├── routing.ts        # Locales and default locale — the single source of truth
├── navigation.ts     # Locale-aware Link, redirect, usePathname, useRouter, getPathname
├── request.ts        # Per-request config; resolves the locale and loads messages
├── proxy.ts          # createMiddleware(routing)
├── i18n.d.ts         # Types `Locale` and every message key
└── messages/en.json  # Translations
```

`request.ts` and `i18n.d.ts` are deliberately **not** in the barrel — the first is server-only
config loaded by the plugin, the second is a type augmentation the compiler picks up on its own.

### Writing messages

Messages are grouped into namespaces — the top-level keys of `messages/en.json`. Use one namespace
per component or screen so a component only pulls in the keys it needs. Namespaces are camelCase,
like everything else in this codebase:

```json
{
  "metaData": {
    "title": "Create Next App",
    "description": "Generated by create next app"
  },
  "loginForm": {
    "heading": "Sign in",
    "greeting": "Welcome back, {name}",
    "itemCount": "{count, plural, =0 {No items} one {# item} other {# items}}",
    "terms": "I accept the <link>terms</link>"
  }
}
```

Namespaces may nest (`"loginForm": { "errors": { "required": "…" } }`), addressed as
`t('errors.required')` from `useTranslations('loginForm')`.

### Reading translations

In Server _and_ Client Components, use the hook:

```tsx
import { useTranslations } from 'next-intl';

export default function LoginHeading() {
  const t = useTranslations('loginForm');
  return <h1>{t('heading')}</h1>;
}
```

It is not a data-fetching hook — no `await`, and no provider setup per component. Client Components
work because the root layout wraps everything in `NextIntlClientProvider`, which inherits messages
from the server config; you never pass a `messages` prop by hand.

In async server code (`generateMetadata`, Server Components that already `await`) use the awaitable
form instead:

```ts
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('metaData');
```

Both infer namespaces and keys from `messages/en.json`, so a typo is a compile error rather than a
`metaData.titel` string rendered to the user.

#### Values, plurals and rich text

```tsx
const t = useTranslations('loginForm');

t('greeting', { name: user.name }); // -> "Welcome back, Ada"
t('itemCount', { count: 0 }); // -> "No items"
t('itemCount', { count: 3 }); // -> "3 items"

// Embedded markup — the message stays one translatable string
t.rich('terms', {
  link: (chunks) => <a href="/terms">{chunks}</a>,
});
```

Plurals, `select`, and date/number skeletons all use
[ICU message syntax](https://next-intl.dev/docs/usage/messages), so branching lives in the message
file rather than in JSX.

#### Dates, numbers and currency

Do not reach for `toLocaleString` — the formatter is already bound to the active locale:

```tsx
import { useFormatter } from 'next-intl';

const format = useFormatter();

format.dateTime(publishedAt, { dateStyle: 'medium' });
format.number(price, { style: 'currency', currency: 'USD' });
format.relativeTime(commentedAt);
```

`getFormatter()` from `next-intl/server` is the awaitable equivalent.

### Linking between pages

Import navigation helpers from `_i18n`, **not** from `next/link` or `next/navigation` — these keep
the active locale in the URL for you.

```tsx
import { Link } from '@/app/(shared)/_i18n';

<Link href="/about">About</Link>; // -> /en/about
```

`redirect`, `usePathname`, `useRouter`, and `getPathname` are exported from the same barrel and
behave the same way. `usePathname` returns the path _without_ the locale prefix (`/about`, not
`/en/about`), which is what you want when comparing against an active route.

### Reading the locale

Any Server Component can read it without prop drilling, because `[locale]` sits above the root
layout and is therefore a [root param](https://nextjs.org/docs/app/api-reference/functions/next-root-params):

```ts
import { locale } from 'next/root-params';

const current = await locale();
```

In Client Components use `useLocale()` from `next-intl`.

### Switching locale

Re-push the current path with a different locale — the helpers rewrite the prefix:

```tsx
'use client';

import { useLocale } from 'next-intl';

import { routing, usePathname, useRouter } from '@/app/(shared)/_i18n';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const active = useLocale();

  return (
    <select value={active} onChange={(e) => router.replace(pathname, { locale: e.target.value })}>
      {routing.locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </select>
  );
}
```

With one locale configured this renders a single option — it becomes useful the moment you add a
second.

### Server Actions and Route Handlers

**The hooks above do not work here.** Locale resolution goes through `next/root-params`, which Next
does not support in Route Handlers or Server Actions yet — calling `getTranslations('ns')` in a
Route Handler throws:

```
Route /[locale]/… used `import('next/root-params').locale()` inside a Route Handler.
Support for this API in Route Handlers is planned for a future version of Next.js.
```

Pass the locale explicitly instead. In a Route Handler it comes from the route params:

```ts
import { getTranslations } from 'next-intl/server';

export async function GET(request: Request, context: RouteContext<'/[locale]/items'>) {
  const { locale } = await context.params;
  const t = await getTranslations({ locale, namespace: 'items' });

  return Response.json({ title: t('title') });
}
```

In a Server Action, take it as an argument from the caller (`useLocale()` on the client side):

```ts
'use server';

export async function submit(locale: string, formData: FormData) {
  const t = await getTranslations({ locale, namespace: 'loginForm' });
  // …
}
```

### The proxy

`proxy.ts` at the app root handles locale negotiation and redirects: `/` → `/en`, and any path
without a known locale prefix gets one. It must live beside `app/` because Next requires it there,
so it is a thin delegate over `_i18n/proxy.ts`.

Two constraints if you edit it. The export has to be named `proxy` (or be a default _declaration_ —
`export { default } from …` is not recognised by Next's static analysis and fails the build). And
`config.matcher` must stay a literal, since it is read at build time and cannot be imported from
`routing.ts`.

### Adding a locale

1. Copy `messages/en.json` to `messages/<locale>.json` and translate the values.
2. Add the code to `locales` in `routing.ts`.

Nothing else changes: `generateStaticParams`, the type augmentation, and the proxy all derive from
`routing.ts`. Missing or misspelled keys in the new file surface as type errors, because the
`Messages` type is pinned to the shape of `en.json`.

### Static rendering

`generateStaticParams` in the root layout is required, not decorative: with Cache Components on, a
root param with no declared value fails the build. It is already wired to `routing.locales`, so
adding a locale keeps every locale prerendered — `/en` builds as static HTML today.

## Caching and revalidation

Cache Components are enabled (`cacheComponents: true` in `next.config.ts`), so routes are dynamic by
default and you opt individual functions or components into caching with `use cache`. Uncached async
work must sit under a `<Suspense>` boundary.

`cacheService` layers a **path-string cache key** convention on top of Next's
`cacheTag`/`revalidateTag`. A path is tagged hierarchically, so revalidating a parent path
invalidates everything beneath it:

| Cached as                                 | Tags written                                  |
| ----------------------------------------- | --------------------------------------------- |
| `cacheService.tag('/items')`              | `path:/`, `path:/items`                       |
| `cacheService.tag('/items/1')`            | `path:/`, `path:/items`, `path:/items/1`      |
| `cacheService.tag('/items', { page: 2 })` | `path:/`, `path:/items`, `path:/items?page=2` |

Revalidating `/items` therefore busts `/items/1` and `/items?page=2` too; revalidating
`/items?page=2` busts only that entry. Query params are sorted and `null`/`undefined` values dropped,
so `{ b: 1, a: 2 }` and `{ a: 2, b: 1 }` produce the same key.

`normalize()` and `toTag()` are public if you need the key itself rather than the side effect:

```ts
cacheService.normalize('/items/', { b: 1, a: 2 }); // '/items?a=2&b=1'
cacheService.toTag('/items', { page: 2 }); // 'path:/items?page=2'
cacheService.toTags('/items/1'); // ['path:/', 'path:/items', 'path:/items/1']
```

### Reading

```ts
import { cacheLife } from 'next/cache';

import { httpService } from '@/app/(shared)/_services';
import { cacheService } from '@/app/(shared)/_services/cacheService';

export async function getItems(page: number) {
  'use cache';
  cacheLife('api');
  cacheService.tag('/items', { page });

  return httpService.get<Item[]>('/items', { page: String(page) }, { withAuth: false });
}
```

`cacheLife` profiles `api`, `apiShort`, `apiLong`, and `apiPrivate` are defined in `next.config.ts`.
Pair one with every `use cache` scope.

### Authenticated endpoints

A `use cache` scope cannot call `cookies()` or `headers()`, and `httpService` reads the access token
from a cookie — so **the shared server cache only fits requests that are not authenticated per user.**
That is the main limitation of this setup; read the table before reaching for `use cache`.

| Data                                      | Approach                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Public endpoints                          | `use cache` + `withAuth: false`.                                               |
| Behind auth, but identical for every user | `use cache` + a server-side service token (below). Cached once, shared by all. |
| Per-user / per-tenant                     | `'use cache: private'`, or don't cache — stream it under `<Suspense>`.         |

`httpService` skips the cookie read whenever an `Authorization` header is already set, so a cached
function can authenticate with a token that does not come from the request:

```ts
export async function getCategories() {
  'use cache';
  cacheLife('apiLong');
  cacheService.tag('/categories');

  return httpService.get<Category[]>('/categories', undefined, {
    headers: { Authorization: `Bearer ${process.env.API_SERVICE_TOKEN}` },
  });
}
```

Do **not** read the user's token outside the scope and pass it in as an argument. Arguments become
part of the cache key, so a rotating access token produces a fresh cache entry on every rotation
(near-zero hit rate) while filling the shared server cache with per-user copies of the response.

For per-user data, `'use cache: private'` lifts the restriction — `cookieService` and `httpService`
work normally inside it, with auth intact:

```ts
export async function getProfile() {
  'use cache: private';
  cacheLife('apiPrivate');
  cacheService.tag('/me');

  return httpService.get<Profile>('/me');
}
```

Be clear on what that buys you: a private cache is held in browser memory only, is never stored on
the server, and does not survive a reload. It re-executes on every server render, so it speeds up
client-side navigation within a session and does nothing for server load or initial page load.

Use the `apiPrivate` profile for these, not `api`. A private cache has no server-side entry, so
`revalidate` and `expire` have nothing to act on — only `stale` (how long the browser holds the
value) is meaningful, which is why `apiPrivate` sets just that. Its 5 minutes is also the threshold
above which the content is eligible for the route's App Shell; under 30 seconds it would be dropped
from prerenders altogether.

### Writing

Invalidate from inside the Server Action that performed the mutation, so the write and the cache
bust stay together:

```ts
'use server';

import { httpService } from '@/app/(shared)/_services';
import { cacheService } from '@/app/(shared)/_services/cacheService';

export async function createItem(body: ItemInput) {
  await httpService.post('/items', body);
  cacheService.update('/items');
}

export async function updateItem(id: string, body: ItemInput) {
  await httpService.patch(`/items/${id}`, body);
  cacheService.update(`/items/${id}`); // narrow: only this item's entry
  cacheService.revalidate('/items'); // broad: the list and everything under it
}
```

| Method                           | Wraps                       | Use when                                                        |
| -------------------------------- | --------------------------- | --------------------------------------------------------------- |
| `cacheService.update()`          | `updateTag`                 | Read-your-own-writes. Expires immediately. Server Actions only. |
| `cacheService.revalidate()`      | `revalidateTag(tag, 'max')` | Background refresh; stale content may be served meanwhile.      |
| `cacheService.revalidateRoute()` | `revalidatePath`            | Invalidate a whole route by its file path, e.g. `/items/[id]`.  |
| `cacheService.refresh()`         | `refresh`                   | Refresh client-cached dynamic data. Server Actions only.        |

`revalidate()` takes the same params plus an expiry profile:

```ts
cacheService.revalidate('/items', { params: { page: 2 } });
cacheService.revalidate('/items', { profile: 'apiShort' });
cacheService.revalidateRoute('/items/[id]', 'page');
```

Two things to keep in mind:

- `update()` and `refresh()` throw outside a Server Action. From a Route Handler or during a Server
  Component render, use `revalidate()` or `revalidateRoute()` instead.
- `cacheService` is server-only and not exported from the `_services` barrel — import it from
  `_services/cacheService` directly.

A Client Component cannot import `next/cache` at all, so if one needs to trigger invalidation on its
own, give it a narrow `'use server'` function with a fixed or allowlisted path. Avoid a generic
action that takes an arbitrary path from the caller — every export of a `'use server'` file is a
network-reachable endpoint, and a path-taking one lets anyone call `revalidate('/')` and flush the
whole cache.
