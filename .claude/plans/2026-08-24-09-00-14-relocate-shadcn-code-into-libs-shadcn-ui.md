# Title: Plan — Relocate shadcn code into `app/(shared)/_libs/shadcn-ui/`

- Classification: `feature`
- Description: Move 34 shadcn components, their 34 stories, and `cn` into a new `_libs/shadcn-ui/` folder, rewrite all 59 affected import specifiers, and repoint the `components.json` `ui`/`utils`/`lib` aliases.

---

## Approach Summary / Goal

- Pure relocation — **zero behaviour change**. Every file that moves keeps its contents apart from import specifier strings.
- The chosen destination `app/(shared)/_libs/shadcn-ui/` is inside `app/`, which makes this far cheaper than it first appeared: the Storybook `stories` glob, `tsconfig.json` paths and `include`, `postcss.config.mjs`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc`, and Next's routing graph **all need no change whatsoever**.
- The 34 `*.stories.tsx` import their components via relative `./name`, so they move as a unit with **no content edits at all**.
- `cn` moves cleanly: all 33 importers are shadcn components, so `_libs/shadcn-ui/` ends up fully self-contained with no dependency edge back into app code.
- **Goal**: `_libs/shadcn-ui/` holds every shadcn artefact; `pnpm shadcn-ui:add <component>` writes into it; build, lint, and Storybook are green; and `grep -r "_components/shadcn"` over `apps/client` returns nothing.

## Functional Requirements

- `app/(shared)/_libs/shadcn-ui/` contains 34 components, 34 stories, and `cn.ts` (69 files).
- `app/(shared)/_components/shadcn/` no longer exists.
- `app/(shared)/_utils/tailwindUtils.ts` no longer exists; `_utils/` retains `cacheUtils.ts`, `cookieUtils.ts`, `httpUtils.ts`.
- `components.json` aliases: `ui` → `@/app/(shared)/_libs/shadcn-ui`, `utils` → `@/app/(shared)/_libs/shadcn-ui/cn`, `lib` → `@/app/(shared)/_libs/shadcn-ui`. `components` and `hooks` unchanged.
- `npx tsc --noEmit`, `pnpm client lint:check`, `pnpm client format:check`, `pnpm client build`, `pnpm client build-storybook` all exit 0.
- Storybook still discovers all 34 shadcn stories plus the `lucide-icon` and `AppStatusTemplate` stories.
- `grep -rn "_components/shadcn\|tailwindUtils" apps/client --exclude-dir={node_modules,.next}` returns **zero** hits.

## Non-Functional Requirements

- **`git mv` for every move**, never delete-and-recreate — preserves rename detection so the diff reads as a move, not 68 deletions plus 68 additions.
- **No content changes beyond import specifiers.** Component logic, props, `'use client'` directives, and story definitions are byte-identical apart from the rewritten strings.
- **Import ordering must be re-satisfied.** `simple-import-sort` is an ESLint *error*, and the path change reorders things: `_components` < `_libs` < `_utils` alphabetically, so `cn` moves position in every file that also imports sibling components (`input-group.tsx`, `combobox.tsx`, `field.tsx`, `sheet.tsx`, `dialog.tsx`, `calendar.tsx`, `alert-dialog.tsx`, `pagination.tsx`, `button-group.tsx`). `eslint --fix` handles this, but it must actually be run.
- **No new `index.ts` barrel.** `README.md` L67–71 documents a deliberate no-barrel/flat-folder decision; preserve it.

## Files in Scope

**Created (1 dir, 69 files by move)**

- `app/(shared)/_libs/shadcn-ui/` — 34 `*.tsx` + 34 `*.stories.tsx` + `cn.ts`

**Moved (69)**

| From | To |
|---|---|
| `app/(shared)/_components/shadcn/*.tsx` (34) | `app/(shared)/_libs/shadcn-ui/*.tsx` |
| `app/(shared)/_components/shadcn/*.stories.tsx` (34) | `app/(shared)/_libs/shadcn-ui/*.stories.tsx` |
| `app/(shared)/_utils/tailwindUtils.ts` | `app/(shared)/_libs/shadcn-ui/cn.ts` |

**Deleted (1)**

- `app/(shared)/_components/shadcn/` (empty after the move)

**Modified — import rewrites (59 statements)**

| Rewrite | Statements | Files |
|---|---|---|
| `_components/shadcn/X` → `_libs/shadcn-ui/X` (intra-folder) | 13 | 10 (moved files) |
| `_components/shadcn/X` → `_libs/shadcn-ui/X` (external) | 13 | 9 |
| `_utils/tailwindUtils` → `_libs/shadcn-ui/cn` | 33 | 33 (moved files) |

The 9 external files: `app/(routes)/[locale]/layout.tsx`, `error.tsx` (×2), `page.tsx`, `not-found.tsx`, `app/global-not-found.tsx`, `app/global-error.tsx` (×2), `app/(shared)/_components/lucide-icon.stories.tsx` (×2), `app/(shared)/_components/templates/AppStatusTemplate/index.tsx`, `index.stories.tsx` (×2).

**Modified — config & docs (3)**

- `apps/client/components.json` — 3 alias values
- `apps/client/README.md` — folder tree (L40–54) and the shadcn rationale note (L67–71)
- `docs/2026-08-21-15-37-45-introduce-vitest-unit-testing-to-client.md` — 2 stale path references

**Explicitly unchanged — must be byte-identical afterwards**

`.storybook/main.ts`, `.storybook/preview.tsx`, `tsconfig.json`, `postcss.config.mjs`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.gitignore`, `app/(shared)/_assets/css/globals.css`, `package.json`, and the **contents** of all 34 `*.stories.tsx`.

## Risks & Assumptions

- **Risk (high) — the multi-line specifier.** `combobox.tsx` L8–13 spans six lines: `import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/app/(shared)/_components/shadcn/input-group';`. A naive line-oriented `sed` will corrupt it. The rewrite must target the quoted path string, not whole `import` lines.
- **Risk (medium) — import-order churn.** Covered under Non-Functional above; `eslint --fix` is a mandatory task, not an optional cleanup.
- **Risk (medium) — the `(shared)` parentheses.** Every shell command touching these paths needs quoting/escaping; an unquoted glob in zsh silently matches nothing rather than erroring. Every task's acceptance criterion is a positive assertion (file exists / grep count is zero), never "the command ran without output".
- **Risk (low) — stale doc reference.** The Vitest plan saved earlier names `app/(shared)/_components/shadcn/**` as a coverage exclusion and `_utils/tailwindUtils.spec.ts` as a spec target. Both paths die with this move; task 9 updates them so a future developer sub-agent isn't sent to a nonexistent path.
- **Assumption**: `cn.ts` sits directly at `_libs/shadcn-ui/cn.ts`, not `_libs/shadcn-ui/lib/cn.ts`. Inferred from the user's "match with original setup" plus the `cn.ts` filename they specified.
- **Assumption**: `README.md` gets updated because it renders a folder tree that this change falsifies. Purely documentation; no behaviour.
- **Confirmed**: no CI, no active git hooks, no `index.ts` barrel, no relative-path inbound imports anywhere, and `app/(shared)/` produces zero routes — so nothing outside the listed files can break.
- **Note**: this is a **single-developer, no-tester** delegation. Nothing testable changes, and `apps/client` has no test runner (that's the other, un-executed plan). Verification is `tsc`/lint/format/build/build-storybook plus grep assertions, which the Root Agent re-runs at review. The tasks are also strictly sequential — a parallel split would leave the tree un-buildable between agents for no gain.

## Open Questions / Blockers

- None. Location, scope, `cn` rename, `globals.css`, and alias set are all resolved; every remaining inference is listed above and covered by the approval gate.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
|---|---|---|---|---|---|---|
| 1 | DONE | Create `app/(shared)/_libs/shadcn-ui/` and `git mv` all 68 files from `_components/shadcn/` | developer | none | `ls` shows 34 `*.tsx` + 34 `*.stories.tsx` in the new dir; `_components/shadcn/` gone; `git status` reports renames (`R`), not add/delete pairs | `clean-code` |
| 2 | DONE | `git mv` `_utils/tailwindUtils.ts` → `_libs/shadcn-ui/cn.ts` | developer | 1 | `cn.ts` exists and still exports `cn`; `_utils/` contains exactly `cacheUtils.ts`, `cookieUtils.ts`, `httpUtils.ts`; `git status` shows a rename | `clean-code` |
| 3 | DONE | Rewrite the 13 intra-folder specifiers `@/app/(shared)/_components/shadcn/X` → `@/app/(shared)/_libs/shadcn-ui/X` across the 10 moved files. **Target the quoted path string, not whole lines** — `combobox.tsx` L8–13 is multi-line | developer | 1 | `grep -c "_components/shadcn"` over `_libs/shadcn-ui/` returns 0; `combobox.tsx` still imports all 4 `InputGroup*` names with its multi-line form intact | `clean-code` |
| 4 | DONE | Rewrite the 33 `cn` imports `@/app/(shared)/_utils/tailwindUtils` → `@/app/(shared)/_libs/shadcn-ui/cn` | developer | 2, 3 | Exactly 33 files under `_libs/shadcn-ui/` import `cn` from the new alias path; `sonner.tsx` still has no `cn` import; zero `tailwindUtils` hits remain anywhere | `clean-code` |
| 5 | DONE | Rewrite the 13 external specifiers across the 9 consumer files | developer | 1 | All 9 files import from `_libs/shadcn-ui/`; `grep -rn "_components/shadcn" apps/client --exclude-dir={node_modules,.next}` returns 0 hits | `clean-code` |
| 6 | DONE | Update `components.json`: `ui` → `@/app/(shared)/_libs/shadcn-ui`, `utils` → `@/app/(shared)/_libs/shadcn-ui/cn`, `lib` → `@/app/(shared)/_libs/shadcn-ui`. Leave `components`, `hooks`, and the whole `tailwind` block untouched | developer | 2 | Valid JSON, Prettier-clean; `tailwind.css` still `app/(shared)/_assets/css/globals.css`; `components`/`hooks` unchanged | `clean-code` |
| 7 | DONE | Run `pnpm client lint --fix` then `pnpm client format` to resolve `simple-import-sort` reordering caused by the `_components` → `_libs` → `_utils` alphabetical shift | developer | 3–6 | `pnpm client lint:check` and `format:check` both exit 0; the diff shows only import reordering, no logic edits | `clean-code` |
| 8 | DONE | Update `README.md` folder tree (L40–54) and the shadcn rationale note (L67–71) to the new location, **preserving the no-barrel/flat-folder rationale** | developer | 1 | Tree shows `_libs/shadcn-ui/`; no stale `_components/shadcn` reference; the flat-folder justification still reads correctly | `clean-code` |
| 9 | DONE | Update the 2 stale paths in `docs/2026-08-21-15-37-45-introduce-vitest-unit-testing-to-client.md`: coverage exclude `_components/shadcn/**` → `_libs/shadcn-ui/**`, and spec target `_utils/tailwindUtils.spec.ts` → `_libs/shadcn-ui/cn.spec.ts` | developer | 2 | Both references updated; **no other line of that document altered** | `clean-code` |
| 10 | DONE | Full verification sweep in `apps/client`: `npx tsc --noEmit`, `lint:check`, `format:check`, `build`, `build-storybook`, plus the two grep assertions | developer | 1–9 | All five commands exit 0; both greps return 0 hits; `build-storybook` output confirms all 34 shadcn stories indexed; report pastes output for any non-zero exit | `clean-code` |

---

**Delegation shape**: a single developer sub-agent on Sonnet, tasks 1–10 in order. No tester — nothing testable changes and the client has no test runner yet. The Root Agent re-runs the full verification sweep at Step 6 rather than trusting the self-report.
