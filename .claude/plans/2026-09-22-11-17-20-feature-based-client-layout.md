# Title: Plan — Feature-based client layout: route-only code in `_`-prefixed folders, shared code in `src/shared/`

- Classification: feature
- Description:
  - Move `components/`, `hooks/`, and `utils/` into `src/shared/`.
  - Move route-only code into `_components`, `_schemas`, and `_constants` inside each route.
  - Delete `src/schemas/` and `src/constants/`.
  - Change Vitest, shadcn, and the docs to match.

---

## Approach Summary / Goal

- General rule:
  - Code used by only one route goes in that route's `_<kind>/` folder (`_components`, `_schemas`, `_hooks`, `_utils`, `_constants`).
  - Our own code used by 2 or more routes goes in `src/shared/<kind>/` (`components`, `hooks`, `utils`, and later `schemas` or `constants` when needed).
  - Third-party wrappers (`src/libs/`), `src/assets/`, and `src/proxy.ts` stay where they are.
- Imports use the existing alias: `@/shared/...`. No new alias.
- The `shared/` move runs first, so the route tasks write the new `@/shared/...` paths from the start and don't edit the same lines twice.
- We move files with `git mv`, so the git history stays.
- Coverage still skips App Router files. It counts `_`-prefixed folders, except `_constants`.
- Goal: a feature-based layout. `src/` holds `app/`, `shared/`, `libs/`, `assets/`, and `proxy.ts`.

## Functional Requirements

- FR0:
  - `src/components/`, `src/hooks/`, and `src/utils/` move to `src/shared/components/`, `src/shared/hooks/`, and `src/shared/utils/`.
  - Every import changes from `@/components/…`, `@/hooks/…`, and `@/utils/…` to `@/shared/…`.
  - `components.json` aliases change to `"components": "@/shared/components"` and `"hooks": "@/shared/hooks"`.
  - `vitest.config.ts` `serverOnlySpecs` changes to `src/shared/utils/http*.spec.ts`.
  - No file imports `@/components/`, `@/hooks/`, or `@/utils/`.
- FR1: `HealthStatusPanel/{index.tsx,index.spec.tsx,index.stories.tsx}` moves to `src/app/(routes)/[locale]/health/_components/HealthStatusPanel/`.
- FR2: `CacheExplorer/{index.tsx,index.spec.tsx,index.stories.tsx}` moves to `src/app/(routes)/[locale]/cache/_components/CacheExplorer/`.
- FR3: `HealthReport` moves to `health/_components/HealthReport/index.tsx`. `HealthReportFallback` moves to `health/_components/HealthReportFallback/index.tsx`, with an `index.stories.tsx`. `HealthReport` still calls `connection()`, then `fetchHealthReport()`, and renders `HealthStatusPanel`. The page keeps `<Suspense fallback={<HealthReportFallback />}><HealthReport /></Suspense>`.
- FR4: Every import of the moved components is updated: `health/page.tsx`, `health/actions.ts` (`HealthResult` type), `cache/page.tsx`, `cache/actions.ts` (cache types).
- FR5: Story titles change to `Routes/Health/HealthStatusPanel`, `Routes/Health/HealthReportFallback`, and `Routes/Cache/CacheExplorer`.
- FR6: `src/shared/components/organisms/.gitkeep` comes back, because the folder is now empty.
- FR7: `src/schemas/cacheSearchSchema{.ts,.spec.ts}` moves to `src/app/(routes)/[locale]/cache/_schemas/`. `CacheExplorer` imports from the new path. `src/schemas/` is deleted.
- FR8: Each route gets its own `_constants/apiEndpoints.ts`, grouped by HTTP method, `as const`, with a one-line JSDoc. Only methods that have entries are listed.
  - `health/_constants/apiEndpoints.ts`: `{ get: { health: '/health' } }`
  - `cache/_constants/apiEndpoints.ts`: `{ get: { cache: '/cache' }, delete: { cache: '/cache' } }`
  - Each `actions.ts` imports from `./_constants/apiEndpoints`.
- FR9: `src/constants/` is deleted (`apiEndpoints.ts` and the empty `storageKeys.ts`). No file imports `@/constants/`.
- FR10: Vitest coverage:
  - It skips App Router files under `src/app/(routes)/**`.
  - It includes files inside `_`-prefixed folders.
  - It skips `**/_constants/**`, and removes the old `src/constants/**` entry.
  - It still skips `src/libs/**`, specs, and stories.
- FR11: The docs describe the full layout:
  - `CODING_CONVENTIONS.md`:
    - Project structure tree: show `src/shared/{components,hooks,utils}` and the route `_<kind>/` folders. Remove `src/schemas/` and `src/constants/`.
    - Components (Atomic Design now lives in `shared/components/`): the general rule replaces "stay as local functions in `page.tsx`". The rule "Shared components must not import from `src/app`" becomes "Code in `src/shared/` must not import from `src/app`".
    - Naming table: component, hook, util, schema, and constant paths.
    - Forms, HTTP (endpoints in the route's `_constants/apiEndpoints.ts`), and Testing (`_`-folders are tested, except `_constants`).
    - Imports: `@/shared/…` for shared code, and relative paths inside a route.
  - `PROJECT_OVERVIEW.md`: the `apps/client/src` layout row, and the key facts that name `utils/` paths (`logUtils`, `envUtils`) and "no specs in routes".

## Non-Functional Requirements

- No change in behavior or UI on any page. The API paths called stay the same.
- `/health` still streams (`◐` in the build output). `/cache` still blocks and returns 404 in production.
- `pnpm client lint`, `typecheck`, `test`, `test:cov`, and `build` all pass. Storybook still finds every story (its `src/**/*.stories.tsx` glob covers the new folders).

## Files in Scope

**Move (`git mv`):**
- `src/components/` → `src/shared/components/`
- `src/hooks/` → `src/shared/hooks/`
- `src/utils/` → `src/shared/utils/`
- `src/shared/components/organisms/HealthStatusPanel/*` → `src/app/(routes)/[locale]/health/_components/HealthStatusPanel/*`
- `src/shared/components/organisms/CacheExplorer/*` → `src/app/(routes)/[locale]/cache/_components/CacheExplorer/*`
- `src/schemas/cacheSearchSchema{.ts,.spec.ts}` → `src/app/(routes)/[locale]/cache/_schemas/`

**Create:**
- `src/app/(routes)/[locale]/health/_components/HealthReport/index.tsx`
- `src/app/(routes)/[locale]/health/_components/HealthReportFallback/{index.tsx,index.stories.tsx}`
- `src/app/(routes)/[locale]/health/_constants/apiEndpoints.ts`
- `src/app/(routes)/[locale]/cache/_constants/apiEndpoints.ts`
- `src/shared/components/organisms/.gitkeep`

**Delete:**
- `src/schemas/`, `src/constants/`

**Change:**
- Import-only edits: `src/app/(routes)/[locale]/{error.tsx,not-found.tsx}`, `src/app/{global-error.tsx,global-not-found.tsx}`, `src/proxy.ts`, and the moved `CacheExplorer/index.spec.tsx`
- `src/app/(routes)/[locale]/health/{page.tsx,actions.ts}`, `cache/{page.tsx,actions.ts}`
- The moved `CacheExplorer/index.tsx` (schema import) and the two moved stories (titles)
- `apps/client/components.json`
- `apps/client/vitest.config.ts`
- `.claude/references/CODING_CONVENTIONS.md`, `.claude/references/PROJECT_OVERVIEW.md`

## Risks & Assumptions

- Assumption: code inside a route uses relative imports (`./_components/HealthReport`, `./_constants/apiEndpoints`, `../../_schemas/cacheSearchSchema`). The docs will add this rule.
- Assumption: both route endpoint files keep the name `apiEndpoints`, so the call sites stay unchanged.
- Assumption: future shared schemas and constants go in `src/shared/schemas/` and `src/shared/constants/`, and we create those folders only when needed.
- Assumption: story titles for shared components stay the same (`Organisms/…`, `Templates/…`). Only the moved route components change to `Routes/<Route>/<Name>`.
- Assumption: nothing else becomes route-only. `timeUtils`, `envUtils`, `cacheUtils`, and all hooks stay in `shared/`.
- Assumption: `HealthReport` gets no spec (your choice). It counts as 0% covered, and there is no threshold.
- Risk: an old plan file in `.claude/plans/` still names the old paths. We don't edit old plans.
- Risk: after a shadcn update, `pnpm client shadcn-ui:add` might still write files to the old path if `components.json` is wrong. The tester checks this with a dry run (`--dry-run`, if the CLI supports it). It must not add real files.
- Risk: the Vitest coverage glob for `_`-prefixed folders may not work as expected. The developer must check the real `test:cov` output.

## Open Questions / Blockers

- Playwright check is set to `Ask-User`. Do you want a quick browser check of `/health` and `/cache` after the build? This does not block the plan.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | DONE | `git mv` `components/`, `hooks/`, and `utils/` into `src/shared/`. Change every `@/components/`, `@/hooks/`, and `@/utils/` import to `@/shared/…`. Update `components.json` aliases and `serverOnlySpecs` in `vitest.config.ts`. | developer | none | FR0 is met. `grep -rE "@/(components\|hooks\|utils)/" src` finds nothing. Typecheck passes. | `clean-code` |
| 2 | DONE | `git mv` `shared/components/organisms/HealthStatusPanel` → `health/_components/HealthStatusPanel`. Update imports in `health/page.tsx` and `health/actions.ts`. Set the story title to `Routes/Health/HealthStatusPanel`. | developer | 1 | FR1, FR4 (health part), and FR5 are met. Typecheck passes. | `clean-code` |
| 3 | DONE | `git mv` `shared/components/organisms/CacheExplorer` → `cache/_components/CacheExplorer`. Update imports in `cache/page.tsx` and `cache/actions.ts`. Set the story title to `Routes/Cache/CacheExplorer`. Add `shared/components/organisms/.gitkeep`. | developer | 1 | FR2, FR4 (cache part), FR5, and FR6 are met. Typecheck passes. | `clean-code` |
| 4 | DONE | `git mv` `src/schemas/cacheSearchSchema{.ts,.spec.ts}` → `cache/_schemas/`. Update the import in `CacheExplorer`. Delete `src/schemas/`. | developer | 3 | FR7 is met. `grep "@/schemas/" src` finds nothing. Typecheck passes. | `clean-code` |
| 5 | DONE | Move `HealthReport` and `HealthReportFallback` from `health/page.tsx` into `health/_components/`, with named exports and JSDoc. Add a `Routes/Health/HealthReportFallback` story. Keep `page.tsx` small. | developer | 2 | FR3 is met. `pnpm client build` passes, and `/health` is still `◐`. | `clean-code` |
| 6 | DONE | Create `health/_constants/apiEndpoints.ts` and `cache/_constants/apiEndpoints.ts`. Point both `actions.ts` files to them. Delete `src/constants/`. | developer | 2, 3 | FR8 and FR9 are met. `grep "@/constants/" src` finds nothing. Typecheck passes. | `clean-code` |
| 7 | DONE | Change `vitest.config.ts` coverage for `_`-prefixed folders, skip `_constants`, and remove `src/constants/**`. | developer | 1 | FR10 is met. The `test:cov` output lists the `_components` and `_schemas` files and `src/shared/**`, and does not list `page.tsx`, `actions.ts`, or `_constants`. | `clean-code` |
| 8 | DONE | Update `CODING_CONVENTIONS.md` and `PROJECT_OVERVIEW.md` with the full feature-based layout. | developer | none | FR11 is met. The docs follow WRITING_STYLE. | — |
| 9 | DONE | Run `pnpm client lint`, `typecheck`, `test`, `test:cov`, and `build`. Fix only spec or story problems caused by the moves. Report the coverage lines for the moved files. | tester | 1–7 | Every command passes. Every moved spec passes with no loss of test cases. | `aaa-testing` |

Run order:
1. Tasks 1 and 8 run in parallel.
2. Tasks 2, 3, and 7 run in parallel. They touch different files.
3. Tasks 4, 5, and 6 run next.
4. The tester runs last.
