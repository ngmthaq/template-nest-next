# Title: Plan — Not-Found & Error Boundary on Top of Routes

- Classification: feature
- Description: Add a shared presentational status template plus locale-scoped `not-found.tsx` / `error.tsx` and a root `global-error.tsx`, with a catch-all route filling the existing empty `[...rest]/` directory, using no experimental Next.js APIs.

---

## Approach Summary / Goal

- The client's only root layout lives under the dynamic `[locale]` segment, so Next's documented answer for whole-app 404 coverage (`global-not-found.tsx`) is off the table — the user ruled out experimental APIs, and that file requires `experimental.globalNotFound`. Instead, coverage comes from the routing layer that already exists: `apps/client/proxy.ts` localizes every request except `api|_next|_vercel|*.*`, so an unmatched URL lands under `/en/...` and is caught by a catch-all page in the already-present-but-empty `[...rest]/` directory, which calls `notFound()` and renders `[locale]/not-found.tsx`.
- Error coverage is two-layered: `[locale]/error.tsx` wraps pages and nested layouts with a working `retry()` (stable as of Next 16.3), and `app/global-error.tsx` catches failures in the root layout itself, rendering its own `<html>`/`<body>`.
- All three UI files render one shared presentational template — a props-only component with no next-intl hooks inside, which is what lets a Server Component (`not-found`), a Client Component (`error`), and a provider-less Client Component (`global-error`) all reuse it.
- Goal: no route in the client app can produce an unstyled 404 or a white-screen crash.

## Functional Requirements

- Visiting an unmatched path under a locale (e.g. `/en/does-not-exist`) renders the custom 404 UI, not Next's built-in one.
- Calling `notFound()` from any page in the locale tree renders the same 404 UI.
- The 404 UI offers a link back to `/` built with next-intl's locale-aware `Link` from `app/(shared)/_i18n/navigation.ts` — not `next/link`.
- An error thrown while rendering a page or nested layout renders the error UI with a working "Try again" button wired to `retry()`.
- An error thrown by the root layout renders `global-error.tsx` with its own document, global styles, fonts, and a working `retry()`.
- 404 and segment-error copy comes from `en.json` via next-intl; `global-error.tsx` uses literal English (no provider is available above the root layout).
- All four UI files render through the single shared template.

## Non-Functional Requirements

- No experimental Next.js config. `apps/client/next.config.ts` is not modified.
- Zero new dependencies.
- Tailwind styling consistent with `apps/client/app/(routes)/[locale]/page.tsx`, including `dark:` variants.
- `error.tsx` / `global-error.tsx` must not render `error.message` — server-side messages are redacted in production and leaking them is a disclosure risk. `error.digest` may be shown as a support reference.
- Clean-code: template is presentational and prop-driven, no duplicated markup between the four route files.
- No inline comments (per the user's standing preference); TypeScript strict, ESLint + Prettier clean.
- Testing Workflow is `Skip-Testing` — no tester sub-agent, no test files.

## Files in Scope

Created

- `apps/client/app/(shared)/_components/templates/StatusTemplate.tsx` — the single shared template
- `apps/client/app/(routes)/[locale]/not-found.tsx`
- `apps/client/app/(routes)/[locale]/[...rest]/page.tsx` — fills the existing empty dir
- `apps/client/app/(routes)/[locale]/error.tsx`
- `apps/client/app/global-error.tsx`

Modified

- `apps/client/app/(shared)/_components/templates/index.ts` — export the template
- `apps/client/app/(shared)/_components/index.ts` — re-export templates barrel
- `apps/client/app/(shared)/_i18n/messages/en.json` — add `notFound` and `error` keys

Not modified

- `apps/client/next.config.ts`, `apps/client/proxy.ts`

## Risks & Assumptions

- Coverage gap, stated openly: the proxy matcher excludes paths matching `.*\..*`, so a URL like `/foo.bar` bypasses next-intl, never reaches the catch-all, and falls through to Next's built-in 404. Closing that gap needs either the experimental `global-not-found.tsx` (excluded by the user) or loosening the matcher (which risks static-asset serving). The gap is accepted; it affects only file-extension-shaped URLs, which are not real user navigation targets.
- `global-error.tsx` sits outside `NextIntlClientProvider`, so its copy is hardcoded English by necessity, and it must import `globals.css` and the fonts itself since it replaces the root layout.
- Assumption: the empty `[...rest]/` directory was created for exactly this catch-all purpose; the plan fills it rather than removing it.
- Assumption: `cacheComponents: true` is already on and these files introduce no dynamic APIs beyond what next-intl already uses, so no caching regression is expected. The developer verifies with a build.
- Low risk overall: all new files, no existing behavior changed.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                                                                       | Responsible Role | Dependencies | Acceptance Criteria                                                                                          | Skills                          |
| --- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1   | DONE   | Create `StatusTemplate.tsx` in `_components/templates/` — presentational, props `{ code, title, description, children }`, no next-intl hooks, no `'use client'`; Tailwind styling matching `page.tsx` with dark variants     | developer        | none         | Component compiles; importable from both Server and Client Components; contains no translation hooks or server-only imports | `clean-code`                    |
| 2   | DONE   | Export the template from `templates/index.ts` and re-export the templates barrel from `_components/index.ts`                                                                                                                 | developer        | task 1       | `import { StatusTemplate } from '@/app/(shared)/_components'` resolves                                        | `clean-code`                    |
| 3   | DONE   | Add `notFound` (`title`, `description`, `backHome`) and `error` (`title`, `description`, `retry`) keys to `messages/en.json`                                                                                                 | developer        | none         | Keys present; `i18n.d.ts` type inference picks them up with no TS error                                       | `clean-code`                    |
| 4   | DONE   | Create `[locale]/not-found.tsx` — Server Component using `getTranslations('notFound')`, renders `StatusTemplate` with a locale-aware `Link` from `_i18n` back to `/`                                                         | developer        | tasks 1–3    | Custom 404 renders inside the locale layout; home link preserves locale prefix                                | `clean-code`                    |
| 5   | DONE   | Create `[locale]/[...rest]/page.tsx` calling `notFound()` in the existing empty dir                                                                                                                                          | developer        | task 4       | `/en/anything-unmatched` renders the custom 404                                                               | `clean-code`                    |
| 6   | DONE   | Create `[locale]/error.tsx` — `'use client'`, props `{ error, retry }`, `useTranslations('error')`, `console.error(error)` in `useEffect`, retry button wired to `retry()`, renders `StatusTemplate`; never renders `error.message` | developer        | tasks 1–3    | A thrown page error renders the error UI; "Try again" re-renders the segment; no raw message leaked           | `clean-code`, `security-scanner` |
| 7   | DONE   | Create `app/global-error.tsx` — `'use client'`, own `<html>`/`<body>`, imports `globals.css` + fonts from `_theme`, hardcoded English copy, renders `StatusTemplate` with retry                                              | developer        | task 1       | Root-layout failure renders a styled full document with working retry                                         | `clean-code`, `security-scanner` |
| 8   | DONE   | Run `pnpm lint:check`, `pnpm format:check`, and `pnpm build` in `apps/client`; fix any violations                                                                                                                            | developer        | tasks 1–7    | All three commands exit 0                                                                                     | `clean-code`                    |
