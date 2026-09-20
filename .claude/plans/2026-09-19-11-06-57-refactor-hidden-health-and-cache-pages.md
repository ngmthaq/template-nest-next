# Title: Plan — Refactor round for hidden health and cache pages

- Classification: feature (refactor)
- Description: Flatten the new i18n keys, clean up folders, rename `RefreshButton`, move the cache form schema to `src/schemas/`, split the health page into smaller files, and add a shared Vitest render helper.

---

## Approach Summary / Goal

- There are no behavior changes. This is only structure, naming, and test cleanup, following the user's 7 points.
- The cache form schema becomes a factory function `createCacheSearchSchema(t)`. The form values type is inferred from it with Yup's `InferType`.
- The health page file keeps only the page. The data fetch moves to `actions.ts`. `HealthReport` and `HealthReportFallback` move to `src/components/organisms/`, and the page passes the fetch in as a prop.
- Specs get one shared `renderWithIntl()` helper instead of each one wrapping `NextIntlClientProvider` itself.

## Functional Requirements

- FR1: The `health` and `cache` namespaces in `en.json` and `zh.json` are only one level deep. Nested groups become one key, like `health.table.indicator` → `health.tableIndicator`, `health.status.up` → `health.statusUp`, `cache.form.patternLabel` → `cache.formPatternLabel`, `cache.errors.production` → `cache.errorsProduction`. Every `t()` call uses the new keys, and both files have the same keys.
- FR2: `components/molecules/.gitkeep` and `components/organisms/.gitkeep` are deleted, because those folders now have files. `atoms/.gitkeep` stays, because `atoms/` is still empty.
- FR3: `RefreshButton` becomes `RefreshRouterButton`: the folder, the component, `RefreshRouterButtonProps`, the story title, and every import.
- FR4: A new `src/schemas/cacheSearchSchema.ts` exports:
  - `MAX_CACHE_PATTERN_LENGTH`, the 200-character limit
  - `createCacheSearchSchema(t)`
  - `type CacheSearchFormValues = InferType<ReturnType<typeof createCacheSearchSchema>>`

  `CacheExplorer` uses these, and there is no local schema or form values type left in it. `handleDelete` becomes an `async` function with `try/catch/finally`.
- FR5: No change to `HealthStatusPanel` (the user's answer to point 5).
- FR6: A new `apps/client/vitest.helpers.tsx` exports `renderWithIntl(ui)`, which renders with `NextIntlClientProvider` and the English messages. The alias `@vitest-helpers` works in both Vitest and TypeScript. The `HealthStatusPanel` and `CacheExplorer` specs use it.
- FR7: The health route files change like this:
  - `health/actions.ts` (with `import 'server-only'`) exports `fetchHealthReport`.
  - `src/components/organisms/HealthReport/index.tsx` is an async Server Component with the prop `loadReport: () => Promise<HealthResult | null>`. It calls `await connection()`, then `loadReport()`, and renders `HealthStatusPanel`.
  - `src/components/organisms/HealthReportFallback/index.tsx` is the skeleton.
  - `page.tsx` only renders the title, `RefreshRouterButton`, and `<Suspense fallback={<HealthReportFallback />}><HealthReport loadReport={fetchHealthReport} /></Suspense>`.
  - `HealthReport` gets no story, because Storybook can't render async Server Components. `HealthReportFallback` gets a story.
- All behavior stays the same. The pages, the proxy 404, and the tests work as before.

## Non-Functional Requirements

- Build, lint, typecheck, and test all pass.
- The files follow the naming rules in the project conventions.

## Files in Scope

(Paths are under `apps/client/`.)

**Modify:**
- `src/libs/next-intl/messages/en.json`, `zh.json`
- `src/components/organisms/CacheExplorer/index.tsx` and `index.stories.tsx`
- `src/components/organisms/HealthStatusPanel/index.tsx` (new key names only)
- `src/app/(routes)/[locale]/health/page.tsx`, `cache/page.tsx`
- `vitest.config.ts`, `tsconfig.json` (the alias only)
- `src/components/organisms/CacheExplorer/index.spec.tsx`, `HealthStatusPanel/index.spec.tsx`

**Rename:** `src/components/molecules/RefreshButton/` → `src/components/molecules/RefreshRouterButton/`, including its `index.tsx`, `index.stories.tsx`, and `index.spec.tsx`.

**Create:**
- `src/schemas/cacheSearchSchema.ts` and `cacheSearchSchema.spec.ts`
- `src/app/(routes)/[locale]/health/actions.ts`
- `src/components/organisms/HealthReport/{index.tsx,index.spec.tsx}`
- `src/components/organisms/HealthReportFallback/{index.tsx,index.spec.tsx,index.stories.tsx}`
- `vitest.helpers.tsx`

**Delete:** `src/components/molecules/.gitkeep`, `src/components/organisms/.gitkeep`.

## Risks & Assumptions

- Assumption: flat keys use the old path in camelCase, so `errors.production` becomes `errorsProduction`.
- Assumption: the helper file is `.tsx`, not `.ts`, because it uses JSX (the user's pick).
- `cache/actions.ts` and `health/actions.ts` are inside `(routes)`, so they get no specs and no coverage, the same as before.
- To type `t` in `createCacheSearchSchema(t)`, we need next-intl's type for the `cache` namespace. The developer will use the typed form from next-intl, so a key with a typo fails typecheck.
- `CODING_CONVENTIONS.md` does not describe `src/schemas/`, flat i18n keys, or the Vitest helper yet. It is left as it is unless the user asks.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | DONE | Flatten the `health`/`cache` keys in `en.json` and `zh.json`, and update every `t()` call (components, stories, pages). | developer | none | FR1 is met, and typecheck passes. | `clean-code` |
| 2 | DONE | Delete `molecules/.gitkeep` and `organisms/.gitkeep`. Rename `RefreshButton` → `RefreshRouterButton` (folder with `git mv`, component, props, story title, imports). | developer | none | FR2 and FR3 are met, and no `RefreshButton` name is left. | `clean-code` |
| 3 | DONE | Create `src/schemas/cacheSearchSchema.ts` and use it in `CacheExplorer`. Make `handleDelete` an `async` function with `try/catch/finally`. | developer | 1 | FR4 is met, and the behavior is the same. | `clean-code` |
| 4 | DONE | Create `health/actions.ts` (`server-only`, `fetchHealthReport`), `organisms/HealthReport` (with a `loadReport` prop), and `organisms/HealthReportFallback` (with a story). Make `page.tsx` small. | developer | 1, 2 | FR7 is met. No file in `src/components` imports from `src/app`. `pnpm client build` passes and `/health` still streams (`◐`). | `clean-code` |
| 5 | DONE | Create `vitest.helpers.tsx` with `renderWithIntl`. Add the `@vitest-helpers` alias to `vitest.config.ts` and `tsconfig.json`. Use the helper in the two specs. | tester | 1 | FR6 is met, and no spec wraps `NextIntlClientProvider` itself. | `aaa-testing` |
| 6 | DONE | Update the `RefreshRouterButton` spec. Add `cacheSearchSchema.spec.ts`. Add a `HealthReport` spec: mock `next/server`'s `connection`, `await HealthReport({ loadReport })`, then render the result. Cover a report and `null`. Add a `HealthReportFallback` spec. Update any spec broken by the key renames. | tester | 2, 3, 4, 5 | All specs pass and use AAA comments. | `aaa-testing` |
| 7 | DONE | Run lint, typecheck, test, and build, then `graphify update .`. | tester | 1–6 | Everything passes. | `aaa-testing` |

## Change Round 1 — Put HealthReport and HealthReportFallback back into the health page

- User decision: `HealthReport` and `HealthReportFallback` go back into `health/page.tsx` as local functions, like the first version. This replaces the component part of FR7. `health/actions.ts` stays, and the `loadReport` prop is dropped.
- FR1: `page.tsx` has `generateMetadata`, the local `HealthReport` (`connection()` → `fetchHealthReport()` → `HealthStatusPanel`) and `HealthReportFallback` (two `Skeleton`s), and the page: the title, `RefreshRouterButton`, and `<Suspense fallback={<HealthReportFallback />}><HealthReport /></Suspense>`.
- FR2: `src/components/organisms/HealthReport/` and `src/components/organisms/HealthReportFallback/` are deleted (component, specs, story). No file imports them.
- FR3: The behavior is the same.

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | DONE | Put `HealthReport` and `HealthReportFallback` back into `page.tsx` as local functions. Delete `organisms/HealthReport/index.tsx` and `organisms/HealthReportFallback/{index.tsx,index.stories.tsx}`. | developer | none | FR1 is met, and production code typechecks and lints clean. | `clean-code` |
| C2 | DONE | Delete the two specs and the empty folders. Run lint, typecheck, test, and build, then `graphify update .`. | tester | C1 | FR2 is met. All checks pass, and `/[locale]/health` is still `◐`. | `aaa-testing` |
