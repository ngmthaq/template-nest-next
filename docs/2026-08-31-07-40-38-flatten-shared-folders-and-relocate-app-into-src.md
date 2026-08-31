# Title: Plan — Flatten `(shared)` private folders and relocate `app/` into `src/`

- Classification: feature (structural refactor)
- Description: Hoist the six `app/(shared)/_*` private folders to `src/` as unprefixed siblings of `app/`, move `app/` and `proxy.ts` into a new `src/` root, and repoint the `@/*` alias plus every tooling path that hard-codes the old layout.

---

## Approach Summary / Goal

The `(shared)/_*` folders are already non-routable — the `_` prefix opts them out (`next/dist/build/route-discovery.js:100`), so nothing about routing changes when they leave `app/`. The move is therefore purely a path-and-tooling exercise, with the risk concentrated in configuration rather than in code.

Two silent-failure traps drive the sequencing, both verified in the installed Next 16.3.0 source:

1. **A leftover root `app/` shadows `src/app/` with no warning.** `find-pages-dir.js:31` prioritises `./app` over `./src/app` unconditionally. An empty leftover directory is enough to break the build in a way that produces no error message.
2. **A root `proxy.ts` is silently ignored once `app/` moves.** `build/index.js:695,701` derives `rootDir` as `path.join(appDir, '..')` and enumerates it with a **non-recursive** `getFilesInDir`. With `appDir = src/app`, only `src/` is scanned — a root `proxy.ts` is never discovered, no error is raised, and i18n routing simply stops working. This is why `src/proxy.ts` is mandatory, not stylistic.

Directive semantics are unaffected: `server-only` resolves through its `exports` condition map (`react-server` → `./empty.js`) and webpack issuer layers; `'use server'` is gated on `isAppRouterPagesLayer`; `'use cache'` on the `cacheComponents` flag. All three are module-graph decisions with no path component. Tailwind v4 roots its scan at `process.cwd()` (`apps/client`), so moving `globals.css` changes nothing and **no `@source` directives are needed**.

**Goal:** `apps/client/src/{app,assets,components,constants,hooks,libs,utils,proxy.ts}`, with `@/*` → `./src/*`, and a green build, lint, test, and Storybook build.

## Functional Requirements

- `app/` lives at `apps/client/src/app/`; **no `app/` directory remains at the client root** (verified by explicit assertion, not assumption).
- The six `_*` folders become `src/{assets,components,constants,hooks,libs,utils}`; the `(shared)` route group no longer exists.
- `proxy.ts` lives at `apps/client/src/proxy.ts`; **no `proxy.ts` remains at the client root**.
- All 78 build-breaking `@/app/(shared)/_*` specifiers resolve under the new alias — e.g. `@/libs/shadcn-ui/button`, `@/utils/httpUtils`, `@/components/templates/AppStatusTemplate`.
- `next-intl`'s `AppConfig` augmentation from `src/libs/next-intl/types/i18n.d.ts` is still picked up by the tsconfig glob — asserted explicitly, because this fails **silently** (messages become untyped with no build error).
- `pnpm client build`, `lint:check`, `test`, and `build-storybook` all pass.

## Non-Functional Requirements

- **Zero behavioural change.** This is a pure relocation — no component, util, hook, or config *semantics* change.
- History preservation: use `git mv` so renames stay traceable.
- Import rewrites operate on the **quoted specifier string**, never on whole lines — `src/libs/shadcn-ui/combobox.tsx:9-14` is a multi-line import whose closing line contains the specifier; a `sed`-style line rewrite corrupts it.

## Files in Scope

**Create:** `apps/client/src/`

**Move (`git mv`):**

| From                                                                      | To                                |
| ------------------------------------------------------------------------- | --------------------------------- |
| `apps/client/app/(routes)/`, `global-error.tsx`, `global-not-found.tsx`  | `apps/client/src/app/…`           |
| `apps/client/app/(shared)/_assets/`                                       | `apps/client/src/assets/`         |
| `apps/client/app/(shared)/_components/`                                   | `apps/client/src/components/`     |
| `apps/client/app/(shared)/_constants/`                                    | `apps/client/src/constants/`      |
| `apps/client/app/(shared)/_hooks/`                                        | `apps/client/src/hooks/`          |
| `apps/client/app/(shared)/_libs/`                                         | `apps/client/src/libs/`           |
| `apps/client/app/(shared)/_utils/`                                        | `apps/client/src/utils/`          |
| `apps/client/proxy.ts`                                                    | `apps/client/src/proxy.ts`        |

**Delete:** `apps/client/app/(shared)/` and `apps/client/app/` (must end up fully gone — see trap 1)

**Modify — source (imports):** `src/proxy.ts`; `src/app/global-error.tsx`; `src/app/global-not-found.tsx`; `src/app/(routes)/[locale]/{layout,page,not-found,error}.tsx`; 34 × `src/libs/shadcn-ui/*.tsx`; `src/libs/lucide/lucide-icon.stories.tsx`; `src/components/templates/AppStatusTemplate/{index.tsx,index.stories.tsx}`

**Modify — config:** `apps/client/tsconfig.json` · `next.config.ts` · `components.json` · `eslint.config.mjs` · `.prettierrc` · `.storybook/main.ts` · `.storybook/preview.tsx` · `README.md` · repo-root `.vscode/settings.json` · `docker-compose.yml` (stale comment)

**Modify — test tooling (tester):** `apps/client/vitest.config.ts`

**Explicitly out of scope:** the 26 stale `docs/*.md` mentions — those are dated historical plan records and rewriting them would falsify the log.

## Risks & Assumptions

- **Assumption:** the CSS side-effect import becomes `@/assets/css/globals.css` (alias) rather than a deep relative path. Next and Storybook's Vite both resolve tsconfig paths for CSS imports; if this fails, the fallback is a relative specifier.
- **Assumption:** `docs/*.md` stays untouched (historical record).
- **Deliberate role deviation, stated for transparency:** the developer performs `git mv` on whole directories, which physically relocates the 10 `*.spec.ts(x)` files. A directory move is not test *authoring* — the developer is forbidden from editing any spec file's **contents**. Per the inventory, no spec file needs a content change (they use only relative imports). The tester owns `vitest.config.ts` and the suite run, so the two agents touch disjoint files.
- **Risk — silent shadowing:** an empty leftover `apps/client/app/` breaks the build with no error. Mitigated by an explicit assertion task.
- **Risk — silent proxy loss:** covered above; mitigated by assertion.
- **Risk — silent i18n de-typing:** `i18n.d.ts` is discovered only via a tsconfig glob. Mitigated by an explicit assertion.
- **Risk — alias fan-out:** `tsconfig.json:22`, `vitest.config.ts:11`, and `.storybook/main.ts:20` all anchor `@` at the client root and **must change together**, or tsc, Vitest, and Storybook disagree.
- **Pre-existing rot fixed in passing:** `.vscode/settings.json:10` points at `app/(shared)/_theme/globals.css`, a folder that has not existed for some time.
- `.next/` and `tsconfig.tsbuildinfo` hold stale paths; a clean rebuild is part of verification.
- Nothing is committed. The husky pre-commit hook runs `pnpm version patch`, so committing has a side effect — left to the user.

## Open Questions / Blockers

- None. All three design decisions were settled with the user, and both silent-failure traps are resolved by source-verified facts rather than assumption.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                                 | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                                        | Skills                        |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | DONE   | Create `src/` and `git mv` `app/` → `src/app/`, the six `_*` folders → `src/{assets,components,constants,hooks,libs,utils}`, `proxy.ts` → `src/proxy.ts`; remove emptied `(shared)/` and `app/` | developer        | none         | `ls apps/client` shows no `app/` and no `proxy.ts`; `ls apps/client/src` shows exactly `app assets components constants hooks libs utils proxy.ts`; `git status` reports renames | `clean-code`                  |
| 2   | DONE   | Rewrite all 78 `@/app/(shared)/_X/…` specifiers to `@/X/…` across client source, editing quoted strings only                                                                          | developer        | 1            | `grep -rn "@/app/(shared)" apps/client/src` returns zero hits; `src/libs/shadcn-ui/combobox.tsx` lines 9-14 remain a valid multi-line import                                | `clean-code`                  |
| 3   | DONE   | Repoint the 3 relative `globals.css` imports in `src/app/**` and the 4 relative imports in `.storybook/preview.tsx`                                                                   | developer        | 1            | No specifier anywhere contains `(shared)` or `_assets`/`_libs`; `preview.tsx` imports resolve to `../src/…`                                                                 | `clean-code`                  |
| 4   | DONE   | Set `tsconfig.json` `"@/*": ["./src/*"]` and update `.storybook/main.ts` `@` alias → `<clientRoot>/src` and `stories` glob → `../src/**/*.stories.tsx`                                | developer        | 2, 3         | `pnpm exec tsc --noEmit` passes; both aliases point at `src`                                                                                                                | `clean-code`                  |
| 5   | DONE   | Update `next.config.ts` next-intl path; `components.json` css + 5 aliases; `eslint.config.mjs:24`; `.prettierrc:11`; `.vscode/settings.json:10`; `docker-compose.yml:22` comment      | developer        | 1            | `grep -rn "app/(shared)"` across all config files returns zero hits; `pnpm client lint:check` passes                                                                        | `clean-code`, `security-scanner` |
| 6   | DONE   | Update the directory tree and ~27 path references in `apps/client/README.md` to the new layout                                                                                        | developer        | 1            | README tree matches actual `src/` layout; no `@/app/(shared)` or `_libs`/`_components` references remain                                                                    | `clean-code`                  |
| 7   | DONE   | Repoint `vitest.config.ts` alias → `<clientRoot>/src`, `include` → `src/**/*.spec.{ts,tsx}`, coverage `include`/`exclude` to `src/` equivalents; run the full suite                   | tester           | 1-4          | All 10 spec files are collected (not silently zero — `passWithNoTests: true` would hide that) and pass; coverage report generates                                           | `aaa-testing`, `clean-code`   |
