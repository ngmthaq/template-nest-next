# Title: Plan — Fix ReDoS-prone cache search and untyped i18n locale maps

- **Classification:** bug
- **Description:** Replace the cache endpoint's user-supplied `RegExp` with anchored glob matching that cannot backtrack, and bind the i18n message/direction maps to next-intl's `Locale` union so a missing locale is a compile error rather than a silent English fallback.

---

## Approach Summary / Goal

**Root cause #1:** `compileRegex` hands an attacker-controlled string to `new RegExp` and then executes it against every cache key. `hasNestedQuantifiers` was meant to make that safe, but it only recognises _grouped_ nesting — it has no model of sequential quantifiers, so `'a*'×50` passes and blocks the event loop for **91 seconds against a single 20-character key** (measured). The fix is structural, not another heuristic: glob patterns compiled to a two-pointer wildcard matcher have no backtracking state to explode, so the vulnerability class disappears rather than being filtered.

**Root cause #2:** `loadMessages` and `localeDirections` each restate the locale list from `routing.ts` in a form TypeScript cannot check — a `default:` branch and a `Partial<Record<string, …>>`. Adding a locale therefore fails silently at runtime (English text, `dir="ltr"`) instead of failing at build time. Keying both to next-intl's `Locale` union makes omission a compile error.

**Goal:** the cache search endpoint cannot be made to consume unbounded CPU by any input, and adding a third locale cannot compile until both maps are updated.

## Functional Requirements

1. `CacheService.search` matches keys with anchored glob semantics: `*` = any run of characters (including empty), `?` = exactly one character, all other characters literal.
2. `hasNestedQuantifiers`, `QUANTIFIER_START`, and the `security/detect-non-literal-regexp` suppression are deleted — no `new RegExp` on user input remains in the file.
3. An empty pattern still throws `BadRequestException` with the existing message; the over-length pattern check is retained as a cheap bound.
4. Swagger `@ApiQuery` description/example and the controller JSDoc describe glob syntax (`user:*`), not regex.
5. `localeDirections` is `Record<Locale, 'ltr' | 'rtl'>` — no `Partial`, no `string` key.
6. `request.ts` resolves messages through a `Record<Locale, …>` loader map; an unrecognised locale calls `notFound()` rather than returning English.
7. `layout.tsx` narrows the locale before indexing `localeDirections`, with no `as` cast.

## Non-Functional Requirements

- No new dependencies — the matcher is ~15 lines of iterative two-pointer scanning, O(n×m) bounded, no recursion.
- No inline comments (project convention); JSDoc on public methods only.
- `pnpm lint`, `pnpm format:check`, and `pnpm build` exit 0 in both apps.

## Files in Scope

**Modify**

- `apps/server/src/feature/cache/cache.service.ts` — replace `compileRegex` with `compileMatcher`, delete the guard
- `apps/server/src/feature/cache/cache.controller.ts` — Swagger contract + JSDoc
- `apps/client/app/(shared)/_i18n/dir.ts` — type to `Locale`
- `apps/client/app/(shared)/_i18n/request.ts` — loader map + `notFound()`
- `apps/client/app/(routes)/[locale]/layout.tsx` — narrow before indexing

**Create / Delete:** none.

## Risks & Assumptions

- **Breaking API change.** `GET /cache?pattern=` stops accepting regex. Existing callers using `^user:` must switch to `user:*`. Judged acceptable because the route is `@UseGuards(NonProductionGuard)` — it 403s in production and is a debug/admin surface only.
- **Matching becomes anchored.** `regex.test()` was a _substring_ match, so `user` matched `myuser:42`. Anchored glob requires `*user*` for that. This is stricter and more predictable, but it is a behaviour change beyond the security fix.
- Assumes the `?` wildcard is worth having; it costs nothing and matches standard glob expectations.
- No tests will be written — `PROJECT_OVERVIEW.md` sets `Testing Workflow: Skip-Testing`, so the tester role is not engaged. Worth noting the matcher is exactly the kind of code that benefits from a table of cases; flagging rather than silently expanding scope.

## Open Questions / Blockers

- None. Both approach decisions were resolved with the user during brainstorming.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                                                                                              | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                              | Skills                           |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1   | DONE   | In `cache.service.ts`, replace `compileRegex` with a private `compileMatcher(pattern): (key: string) => boolean` implementing anchored two-pointer glob matching; delete `hasNestedQuantifiers`, `QUANTIFIER_START`, and the eslint-disable line; update `search()` and the class JSDoc | developer        | none         | No `RegExp` construction from user input in the file; `'a*'×50` returns instantly; `user:*` matches `user:42` and not `admin:1`; empty pattern still 400s | `clean-code`, `security-scanner` |
| 2   | DONE   | In `cache.controller.ts`, update the `@ApiQuery` description and `example` and the `search()` JSDoc from regex to glob syntax                                                                                                                     | developer        | task 1       | Swagger example reads `user:*`; no doc text mentions regular expressions                                                                          | `clean-code`                     |
| 3   | DONE   | In `dir.ts` and `request.ts`, import `Locale` from `next-intl`; type `localeDirections` as `Record<Locale, 'ltr' \| 'rtl'>`; replace the `loadMessages` switch with a `Record<Locale, () => Promise<…>>` loader map and call `notFound()` for an unrecognised locale | developer        | none         | Removing an entry from either map is a TS compile error; unknown locale 404s instead of serving English                                           | `clean-code`                     |
| 4   | DONE   | In `layout.tsx`, narrow the locale with `hasLocale(routing.locales, …)` before indexing `localeDirections`, removing the `?? 'ltr'` fallback                                                                                                      | developer        | task 3       | `pnpm build` succeeds with no cast and no non-null assertion; `dir` still renders on `/en` and `/zh`                                              | `clean-code`                     |

> Tasks 1–2 (server) and 3–4 (client) touch disjoint files, so they are delegated to two developer sub-agents spawned in parallel, per Step 4.
