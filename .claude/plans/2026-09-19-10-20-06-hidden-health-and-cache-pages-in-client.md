# Title: Plan — Hidden health and cache pages in the client

- Classification: feature
- Description: Add two hidden pages, `/[locale]/health` and `/[locale]/cache`, that call the server API from server code. The cache page shows a 404 when `APP_ENV=production`.

---

## Approach Summary / Goal

- Each page is a Server Component under `src/app/(routes)/[locale]/`. It calls `await connection()` so it renders on each request. This way it never uses a stale build-time result or build-time `APP_ENV`.
- **Health:** the page calls `GET /health` through `httpUtils`. A `503` still shows the report from the error body. A network error or timeout shows an "API unreachable" state. A client `RefreshButton` calls `router.refresh()` to run the check again.
- **Cache:** the page calls `notFound()` in production. Search and delete run as Server Actions (`'use server'`). Each action also refuses to run in production, so a direct POST cannot get around the page check. A client `CacheExplorer` shows the search form (Formik + Yup), a results table, and a Delete button with a confirm dialog.
- No link, menu, or sitemap entry is added. Both pages send `robots: noindex, nofollow`.

## Functional Requirements

- FR1: `/en/health` and `/zh/health` show an overall status (`ok`/`error`). They also show one row for each indicator (`server`, `mysql`, `redis`) with status `up`/`down`, uptime (server only), and the error text when the indicator is `down`.
- FR2: When the API returns `503`, the health page shows the report from the error body. It does not show the error page.
- FR3: When the API cannot be reached (network error or timeout), the health page shows an "API unreachable" message and the Refresh button.
- FR4: The Refresh button runs the health check again without a full page reload, and shows a loading state while it runs.
- FR5: `/[locale]/cache` shows the 404 page when `APP_ENV === 'production'`. In any other environment (including when `APP_ENV` is not set), the page works.
- FR6: The cache page has a pattern input. The field is required and has at most 200 characters, the same limit as the server. On submit it calls `GET /cache?pattern=…` and shows the result in a table with a `key` column and a `value` column (value shown as formatted JSON). An empty result shows a "No entries found" message.
- FR7: Each result row has a Delete button. It opens a confirm dialog. On confirm, it calls `DELETE /cache/:key` (key URL-encoded), removes the row, and shows a success toast. When `deleted: false`, it shows an info toast ("Key not found").
- FR8: Both Server Actions return an error result, and do not call the API, when `APP_ENV === 'production'`.
- FR9: API errors in search or delete show an error toast. They do not crash the page.
- FR10: Both pages set `robots: { index: false, follow: false }` in metadata. No UI in the app links to them.
- FR11: All texts are in the `health` and `cache` namespaces in `en.json` and `zh.json`.

## Non-Functional Requirements

- Security: the production check runs on the server only (page and actions). The browser never decides it. No `dangerouslySetInnerHTML`. Cache values are shown as text inside `<pre>`.
- Accessibility: strict `jsx-a11y` rules pass. Inputs have labels. Status is shown as text, not only by color.
- Follow the client conventions: Atomic Design folders, `index.tsx` + `index.spec.tsx` + `index.stories.tsx`, `@/` imports, `logUtils` for logging.
- `pnpm client lint:check`, `typecheck`, and `test` all pass.

## Files in Scope

- Modify: `apps/client/src/constants/apiEndpoints.ts` — add `get.health: '/health'`, `get.cache: '/cache'`, `delete.cache: '/cache'`.
- Create: `apps/client/src/utils/envUtils.ts` + `envUtils.spec.ts` — `EnvUtils` class with `isProduction()` (server-only), and the instance `envUtils`.
- Create: `apps/client/src/app/(routes)/[locale]/health/page.tsx`
- Create: `apps/client/src/app/(routes)/[locale]/cache/page.tsx`
- Create: `apps/client/src/app/(routes)/[locale]/cache/actions.ts` — `searchCacheAction`, `deleteCacheAction` (thin, no spec: `(routes)` holds no tests).
- Create: `apps/client/src/components/molecules/RefreshButton/{index.tsx,index.spec.tsx,index.stories.tsx}`
- Create: `apps/client/src/components/organisms/HealthStatusPanel/{index.tsx,index.spec.tsx,index.stories.tsx}`
- Create: `apps/client/src/components/organisms/CacheExplorer/{index.tsx,index.spec.tsx,index.stories.tsx}`
- Modify: `apps/client/src/libs/next-intl/messages/en.json`, `zh.json`

## Risks & Assumptions

- Assumption: "prod" means `APP_ENV === 'production'` on the client, the same way the server uses `NODE_ENV === 'production'`. `staging` counts as non-production, so the cache page works there, and the same is true on the server.
- Assumption: the health and cache pages call the server with no auth (`httpUtils`), because the server endpoints have no auth guard.
- Risk: "hidden" only means there is no link. Anyone who knows the URL can open `/health`, and `/cache` in non-production environments. This matches the server, which is also open.
- Risk: the health page shows raw dependency error text (for example `connect ECONNREFUSED 127.0.0.1:3306`). The server already sends this text in its public `/api/health` response.
- Risk: this Next.js version has breaking changes. The developer must read `node_modules/next/dist/docs/` for `connection()`, Server Actions, and `useRouter().refresh()` before writing code.
- The `CacheExplorer` component gets its two actions as props, so tests and stories can use mocks.
- Files in `src/app/(routes)/**` are excluded from coverage and have no spec files. The route files and `cache/actions.ts` stay thin. The production check that the actions depend on is tested in `envUtils.spec.ts`.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1   | DONE   | Add endpoints to `apiEndpoints.ts`. Add `envUtils.ts` (`isProduction()` reads `process.env.APP_ENV`, marked `server-only`). Add `health` and `cache` i18n namespaces to `en.json` and `zh.json`. | developer | none | Endpoints exist under `get`/`delete`. `envUtils.isProduction()` returns true only for `'production'`. Both message files have the same new keys. Typecheck passes. | `clean-code` |
| 2   | DONE   | Build `RefreshButton` (molecule, `'use client'`, `router.refresh()` inside `useTransition`, spinner while pending) and `HealthStatusPanel` (organism: overall badge, table of indicators, unreachable state). Add stories. | developer | 1 | Covers FR1, FR3, FR4 in the UI. Stories render all three states: ok, error, unreachable. | `clean-code` |
| 3   | DONE   | Build the `health/page.tsx` Server Component: `connection()`, call `httpUtils.get(apiEndpoints.get.health)`, map `HttpUtilsResponseError` 503 → body, network/timeout → unreachable, log other errors with `logUtils`, noindex metadata. | developer | 1, 2 | FR1–FR3, FR10 are met. Opening `/en/health` with the API up shows `ok`. With MySQL stopped it shows `error` plus the error text. | `clean-code` |
| 4   | DONE   | Build `cache/actions.ts` (`'use server'`): `searchCacheAction(pattern)` and `deleteCacheAction(key)`. Both check `envUtils.isProduction()` first and return a typed `{ ok: true, data } \| { ok: false, error }` result. | developer | 1 | FR8 and FR9 are met on the server side. The key is passed through `encodeURIComponent`. No API call happens in production. | `clean-code`, `security-scanner` |
| 5   | DONE   | Build `CacheExplorer` (organism, `'use client'`): Formik + Yup form, results table, `AlertDialog` confirm for delete, Sonner toasts. It takes the actions as props. Add a story. | developer | 1 | FR6, FR7, FR9 are met in the UI. Values are shown in `<pre>` via `JSON.stringify(value, null, 2)`. | `clean-code` |
| 6   | DONE   | Build the `cache/page.tsx` Server Component: `connection()`, then `notFound()` when `envUtils.isProduction()`, noindex metadata, render `CacheExplorer` with the actions. | developer | 4, 5 | FR5 and FR10 are met. With `APP_ENV=production`, `/en/cache` shows the 404 page. | `clean-code` |
| 7   | DONE   | Add unit tests: `envUtils.spec.ts`, `RefreshButton`, `HealthStatusPanel`, `CacheExplorer` specs. No spec files in `src/app/(routes)/**`. | tester | 1–6 | Tests cover: `envUtils.isProduction()` for `production` / `staging` / `development` / unset, `CacheExplorer` search success/empty/error, delete true/false/error, validation of an empty or too-long pattern, panel ok/error/unreachable rendering, refresh calls `router.refresh`. All tests use AAA comments. `pnpm client test` passes. | `aaa-testing` |
| 8   | DONE   | Run `pnpm client lint:check`, `typecheck`, `test`, then `graphify update .`. | tester | 7 | All commands pass. Any failure is reported with its output. | `aaa-testing` |

## Fix Round 1 (after browser check)

- Cause: `cacheComponents: true` made `pnpm client build` fail, because both pages called `connection()` outside `<Suspense>`. In production, `/cache` also sent a 200 status (a soft 404), because the static `[locale]` layout starts streaming before the page's `notFound()` runs.
- User decision: return a real 404 from `proxy.ts`.

| #   | Status | Task | Responsible Role |
| --- | ------ | ---- | ---------------- |
| R1  | DONE   | `health/page.tsx`: static shell + data inside `<Suspense>` with a skeleton fallback | developer |
| R2  | DONE   | `cache/page.tsx`: `export const instant = false`; page `notFound()` kept as a backup guard | developer |
| R3  | DONE   | `CacheExplorer`: handle rejected search/delete actions (error toast, spinner cleared) | developer |
| R4  | DONE   | `HealthStatusPanel`: label lookup instead of nested ternary | developer |
| R5  | DONE   | `RefreshButton`: pass `className` directly | developer |
| R6  | DONE   | `proxy.ts`: in production, rewrite `/cache` and `/<locale>/cache` to the catch-all → real 404 | developer |
| T1  | DONE   | `proxy.spec.ts`: `isCacheRoute` + proxy rewrite/delegate tests | tester |
| T2  | DONE   | `CacheExplorer` spec: rejected-action tests | tester |
| T3  | DONE   | lint, typecheck, test, build, `graphify update .` | tester |
