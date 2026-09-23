# Title: Plan — Validate server responses with Yup schemas in `httpUtils`

- Classification: feature
- Description: `httpUtils` and `httpUtilsAuth` take an optional Yup response schema. They validate the server data and return a typed result, or throw `HttpUtilsValidationError`. Both routes define response schemas in `_schemas/`, and the response types are inferred from them.

---

## Approach Summary / Goal

- Today `httpUtils.get<T>()` only casts the data, so a wrong server shape reaches the UI unchecked.
- We add an optional `schema` to the request options. `request()` validates `response.data` with `stripUnknown: true` and `abortEarly: false`. If the shape is wrong, it throws `HttpUtilsValidationError`.
- A public `parse(schema, data)` method does the same for data we get another way (the health `503` body).
- The actions already catch errors and log them. A validation error ends up as `'unexpected'` (cache) or `null` (health). No UI or i18n change.
- Goal: the client never trusts the server's response shape, and each shape is defined once.

## Functional Requirements

- FR1: `httpUtilsHelper.ts`:
  - `HttpUtilsRequestOptions<T>` gets `schema?: Yup.Schema<T>`.
  - `request<T>()` removes `schema` from the options, so it never reaches axios or fetch.
  - With a schema, `request<T>()` returns the validated value (unknown fields removed). Without a schema, it behaves the same as today.
- FR2: New `HttpUtilsValidationError extends Error` in `httpUtilsHelper.ts`, with `name = 'HttpUtilsValidationError'` and `errors: string[]` (Yup's messages, including field paths). It must **not** store the raw response body, so logs don't leak data.
- FR3: New `public async parse<T>(schema: Yup.Schema<T>, data: unknown): Promise<T>` on `HttpUtilsHelper`, with the same validation and the same error.
- FR4: When a schema is passed, `get`, `post`, `put`, `patch`, `delete`, and the `*FormData` methods infer `T` from it. Calls without a schema still take an explicit `<T>`, so the current callers and specs still compile. `httpUtilsAuth` gets this through `extends`.
- FR5: `cache/_schemas/cacheResponseSchema.ts` exports:
  - `cacheEntrySchema` (`key: string` required, `value` any value) and `cacheEntryListSchema` (an array of it);
  - `cacheDeleteResultSchema` (`key: string`, `deleted: boolean`, both required);
  - `type CacheEntry` and `type CacheDeleteResult`, inferred with `InferType`.
- FR6: `health/_schemas/healthResponseSchema.ts` exports:
  - `indicatorStatusSchema` (`status: 'up' | 'down'`, `error?: string`, `uptime?: number`);
  - `healthResultSchema` (`status: 'ok' | 'error'`, and `info` as a record of indicator statuses with any keys);
  - `type IndicatorStatus` and `type HealthResult`, inferred.
  - The inferred types must match the current interfaces.
- FR7: The hand-written interfaces `CacheEntry`, `CacheDeleteResult`, `IndicatorStatus`, and `HealthResult` are removed from the components. Every importer uses the `_schemas` files instead: the components, both `actions.ts` files, and the specs and stories (import path only). `CacheActionResult` stays in `CacheExplorer`, because it is the action's result, not a server response.
- FR8: The actions:
  - `searchCacheAction` passes `{ schema: cacheEntryListSchema }`.
  - `deleteCacheAction` passes `{ schema: cacheDeleteResultSchema }`.
  - `fetchHealthReport` passes `{ schema: healthResultSchema }`. On a `503`, it returns `await httpUtils.parse(healthResultSchema, error.body)`. If that parse fails, it logs and returns `null`.
  - No more `as HealthResult` casts or explicit `<T>` on these calls.
- FR9: The docs (`CODING_CONVENTIONS.md`):
  - HTTP section: every API call passes a response schema from the route's `_schemas/xxxResponseSchema.ts`.
  - Add `HttpUtilsValidationError` to the typed-errors list.
  - Naming table, Schemas row: response schemas (`xxxResponseSchema.ts`, schemas plus inferred types).

## Non-Functional Requirements

- Security: validation errors log only Yup messages, never the raw body.
- No UI, i18n, or behavior change for valid responses.
- `pnpm client lint:check`, `typecheck`, `test`, `test:cov`, and `build` pass.

## Files in Scope

- Modify: `src/shared/utils/httpUtilsHelper.ts`, `src/shared/utils/httpUtils.ts`, `cache/actions.ts`, `health/actions.ts`, `cache/_components/CacheExplorer/{index.tsx,index.spec.tsx,index.stories.tsx}` (type imports), `health/_components/HealthStatusPanel/{index.tsx,index.spec.tsx,index.stories.tsx}` (type imports), `.claude/references/CODING_CONVENTIONS.md`
- Create: `cache/_schemas/cacheResponseSchema.ts`, `health/_schemas/healthResponseSchema.ts`
- Tests (tester): `src/shared/utils/httpUtilsHelper.spec.ts`, `src/shared/utils/httpUtils.spec.ts` (if needed), new `cache/_schemas/cacheResponseSchema.spec.ts` and `health/_schemas/healthResponseSchema.spec.ts`

## Risks & Assumptions

- Assumption: we keep Yup's default non-strict mode, because `stripUnknown` only works outside strict mode. So Yup may convert simple types (e.g. `"42"` → `42` for a number field). That is acceptable for our endpoints.
- Assumption: `CacheEntry.value` stays `unknown` (Yup `mixed()`). The component already treats it as unknown and pretty-prints it.
- Risk: Yup has no record type. `info` needs `Yup.lazy` (build an object schema from the keys it gets), so the inferred type may need a small type helper to equal `Record<string, IndicatorStatus>`. The developer must prove this with `typecheck`.
- Risk: `request()` must remove `schema` before building the axios config. The current `...fetchOptions` spread would otherwise pass it to fetch. The tester checks this.
- Assumption: the actions stay untested, following the App Router rule. Their logic is covered by the `httpUtils` and schema specs.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | DONE | Add `schema` to the request options, `HttpUtilsValidationError`, and `parse()` in `httpUtilsHelper.ts`, and schema-based `T` inference on the `httpUtils.ts` methods (FR1–FR4). | developer | none | FR1–FR4 are met. Current callers and specs typecheck with no changes. `schema` never reaches the axios config. | `clean-code`, `security-scanner` |
| 2 | DONE | Create `cacheResponseSchema.ts` and `healthResponseSchema.ts` (FR5, FR6). Remove the hand-written interfaces, and point every importer to the schema types (FR7). | developer | none | FR5–FR7 are met. `grep -rn "interface \(CacheEntry\|CacheDeleteResult\|IndicatorStatus\|HealthResult\)" src` finds nothing. Typecheck passes. | `clean-code` |
| 3 | DONE | Use the schemas in both `actions.ts` files, including `parse()` for the health `503` body (FR8). Update the docs (FR9). | developer | 1, 2 | FR8 and FR9 are met. No `as HealthResult` and no `<T>` on these calls. `pnpm client build` passes, `/health` is `◐`, and `/cache` is `ƒ`. | `clean-code` |
| 4 | DONE | Specs: in `httpUtilsHelper.spec.ts` (or `httpUtils.spec.ts`), test that a valid response returns data without unknown fields, a wrong shape throws `HttpUtilsValidationError` with `errors` and no body, no schema means no change, and `schema` is not passed to axios. Test `parse()` for the valid and invalid cases. Add specs for both response schemas (valid, missing field, wrong enum value, unknown field removed, and extra `info` keys accepted). | tester | 1, 2, 3 | All new specs pass and follow AAA. The new code in `httpUtilsHelper.ts` and both `_schemas` files has 100% line coverage. The full suite passes. | `aaa-testing` |

| 5 | DONE | (User change, after tasks 1–4.) Rename `HttpUtilsValidationError` → `HttpUtilsYupValidationError` everywhere: the class, its `name` string, imports, specs, and docs. | developer | 1–4 | `grep -rnw "HttpUtilsValidationError" apps/client/src .claude/references` finds nothing. lint, typecheck, and test pass. | `clean-code` |

Run order: one developer runs tasks 1–3 in order, because they depend on each other. Then the tester runs task 4. Then a developer runs task 5.
