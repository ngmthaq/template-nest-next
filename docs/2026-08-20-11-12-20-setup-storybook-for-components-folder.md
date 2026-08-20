# Title: Plan — Storybook 10 for the `_components` folder

- Classification: feature
- Description: Wire Storybook 10.5.9 (`@storybook/nextjs-vite`) into `apps/client` with theme, i18n, a11y and autodocs support, and author a colocated `.stories.tsx` for every component under `app/(shared)/_components/`.

---

## Approach Summary / Goal

- Add Storybook **10.5.9** to `apps/client` using the **`@storybook/nextjs-vite`** framework (peer-verified against `next@^16`, `react@^19`). Config lives in `apps/client/.storybook/`; dev and build run through the existing workspace filter script (`pnpm client storybook`).
- `preview.tsx` imports the app's real `app/(shared)/_theme/globals.css` so Tailwind v4 tokens, the `.dark` custom variant and the `@layer base` rules render exactly as they do in the app — no duplicated theme.
- Three decorators reproduce the app's real provider tree from `app/(routes)/[locale]/layout.tsx`: `withThemeByClassName` (matching `ThemeProvider`'s `attribute="class"`), `NextIntlClientProvider` with `en`/`zh` messages behind a locale toolbar, and the Geist font variables.
- Stories are **colocated** (`button.tsx` → `button.stories.tsx`), CSF3, one file per component file, each tagged `autodocs` and titled `Shadcn/<Name>` or `Templates/<Name>` so the sidebar mirrors the folder.
- **Goal:** `pnpm client storybook` opens a browsable, light/dark, a11y-audited catalogue of all 35 components in `_components`, with zero new lint or type errors in the existing app.

## Functional Requirements

1. `pnpm client storybook` starts Storybook on port 6006; `pnpm client build-storybook` produces `storybook-static/` without errors.
2. Every one of the 34 files in `_components/shadcn/` and `AppStatusTemplate.tsx` in `_components/templates/` has a sibling `.stories.tsx` with at least a `Default` story, plus a story per declared `variant`/`size` where the component defines them via `cva`.
3. Components render with correct Tailwind v4 tokens — verified by a story showing `bg-background`/`text-foreground` resolving from `globals.css`, not defaults.
4. A toolbar theme switch toggles the `dark` class on the preview `<html>`, and both modes render correctly.
5. A toolbar locale switch swaps between `en` and `zh` messages through `NextIntlClientProvider`.
6. The a11y addon panel runs axe on every story.
7. Autodocs generates a docs page per component from its props.
8. `pnpm client lint:check` and `pnpm client build` pass with the new files present.

## Non-Functional Requirements

- No change to any existing component's source — Storybook is additive only.
- Story files follow the repo's Prettier config (single quotes, semi, 100 cols, `prettier-plugin-tailwindcss`) and pass `simple-import-sort`, strict `jsx-a11y`, and `better-tailwindcss` rules.
- `storybook-static/` is gitignored.
- Storybook's `vite` devDependency is config-only — it must never enter the `next build` path.

## Files in Scope

**Created**

- `apps/client/.storybook/main.ts`
- `apps/client/.storybook/preview.tsx`
- `apps/client/app/(shared)/_components/shadcn/*.stories.tsx` — 34 files
- `apps/client/app/(shared)/_components/templates/AppStatusTemplate.stories.tsx`

**Modified**

- `apps/client/package.json` — Storybook deps + `storybook` / `build-storybook` scripts
- `apps/client/eslint.config.mjs` — `eslint-plugin-storybook` flat config
- `apps/client/.gitignore` — `storybook-static`
- `apps/client/README.md` — short Storybook usage section
- `pnpm-lock.yaml` — install side effect

**Read-only reference (not modified)**

- `apps/client/app/(shared)/_theme/globals.css`, `ThemeProvider.tsx`, `font.ts`
- `apps/client/app/(shared)/_i18n/messages/{en,zh}.json`, `routing.ts`
- `apps/client/app/(routes)/[locale]/layout.tsx`
- `apps/client/components.json`, `tsconfig.json`, `postcss.config.mjs`

## Risks & Assumptions

**Assumptions** (inferred, not stated by the user — flagged for veto)

1. One story file per component _file_; composite files (`field.tsx`, `input-group.tsx`, `combobox.tsx`, `button-group.tsx`, `pagination.tsx`) get one story file demoing the primary composition, not one per sub-export.
2. Sidebar titles are `Shadcn/<PascalName>` and `Templates/<Name>`; empty `atoms/`, `molecules/`, `organisms/` get no stories and keep their `.gitkeep`.
3. Default dev port 6006.
4. Out of scope: Chromatic/visual regression, Storybook interaction tests, CI workflow wiring, and the Vitest test-runner (consistent with `Testing Workflow: Skip-Testing`).

**Risks**

1. **Path alias** — every component imports via `@/app/(shared)/...`. Storybook's Vite builder does not read `tsconfig.json` `paths` by default; `main.ts` must set an explicit `viteFinal` alias `'@' → apps/client`. Missed, every story fails to resolve.
2. **Glob and the `(shared)` folder** — parentheses are extglob syntax in picomatch. The stories glob must avoid them: `'../app/**/*.stories.tsx'`, not a path containing `(shared)`.
3. **`next/font/google`** — Geist is fetched at build time. On an offline machine Storybook boot can fail or silently drop the font. Mitigation: `@storybook/nextjs-vite` supports `next/font` natively; if it fails, fall back to declaring `--font-geist-sans`/`--font-geist-mono` in a preview stylesheet. Developer must report which path was taken.
4. **`next build` type-checks stories** — `tsconfig.json` includes `**/*.tsx`, so colocated stories are compiled by the app build. A type error in any story breaks `pnpm client build`. This is why task 9 re-runs the real build.
5. **Stateful components** — `calendar` (react-day-picker v10), `combobox`, `input-otp`, `select`, `switch`, `checkbox`, `radio-group` need `useState` inside a `render` function; `sonner` needs a mounted `<Toaster />` next to its trigger. Naive static stories will render dead controls.
6. **Strict `jsx-a11y`** — story files are linted too. Bare `<Input>`/`<Label>` demos will trip `control-has-associated-label` unless wired with `htmlFor`/`id`.
7. **`vite@^8` in a pnpm workspace** alongside Next 16's Turbopack — expected to be inert, but watch for peer warnings on install.

## Open Questions / Blockers

- None. All four brainstorming questions were answered; the 35-vs-37 count discrepancy is a correction, not a blocker.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                                                                                                                                                          | Responsible Role | Dependencies | Acceptance Criteria                                                                                                            | Skills                        |
| --- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| 1   | DONE   | Install `storybook@^10.5.9`, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-themes`, `eslint-plugin-storybook`, `vite` as devDeps in `apps/client/package.json`; add `storybook` and `build-storybook` scripts                                    | developer        | none         | `pnpm install` completes; `pnpm client storybook --version` reports 10.5.x; no unmet peer errors                                | `clean-code`                  |
| 2   | DONE   | Write `.storybook/main.ts`: framework `@storybook/nextjs-vite`, `stories: ['../app/**/*.stories.tsx']`, addons a11y/docs/themes, `staticDirs: ['../public']`, `viteFinal` aliasing `@` → client root                                                                                            | developer        | 1            | Storybook boots and discovers stories under `app/(shared)/_components/`; `@/...` imports resolve                                | `clean-code`                  |
| 3   | DONE   | Write `.storybook/preview.tsx`: import `globals.css`; `withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'light', parentSelector: 'html' })`; `NextIntlClientProvider` decorator with a `locale` globalType (`en`/`zh`) reading `_i18n/messages/*.json`; Geist font variables; `parameters.a11y`; `tags: ['autodocs']` | developer        | 2            | Theme toggle flips `.dark` on `<html>` and colors change; locale toggle swaps messages; a11y panel populated; a docs tab appears per story | `clean-code`                  |
| 4   | DONE   | Add `eslint-plugin-storybook` flat config to `eslint.config.mjs`; add `storybook-static` to `apps/client/.gitignore`; add a Storybook section to `apps/client/README.md`                                                                                                                        | developer        | 1            | `pnpm client lint:check` passes on `.storybook/**`; `storybook-static` untracked                                                | `clean-code`                  |
| 5   | DONE   | Stories for **13 form primitives**: `button`, `button-group`, `input`, `input-group`, `input-otp`, `textarea`, `label`, `checkbox`, `radio-group`, `switch`, `select`, `combobox`, `field`                                                                                                      | developer        | 3            | 13 colocated `.stories.tsx`; every `cva` variant/size has a story; stateful controls actually toggle; `htmlFor`/`id` wired so `jsx-a11y` passes | `clean-code`                  |
| 6   | DONE   | Stories for **9 overlays**: `alert-dialog`, `dialog`, `drawer`, `sheet`, `popover`, `hover-card`, `tooltip`, `dropdown-menu`, `sonner`                                                                                                                                                          | developer        | 3            | 9 colocated `.stories.tsx`; each opens from a visible trigger inside the canvas; `sonner` story mounts `<Toaster />`            | `clean-code`                  |
| 7   | DONE   | Stories for **12 display/layout**: `table`, `tabs`, `badge`, `alert`, `avatar`, `breadcrumb`, `pagination`, `separator`, `skeleton`, `spinner`, `calendar`, `typography`                                                                                                                        | developer        | 3            | 12 colocated `.stories.tsx`; `typography` covers every `variant`; `calendar` is interactive via `useState`; `avatar` demos image + fallback | `clean-code`                  |
| 8   | DONE   | Story for `templates/AppStatusTemplate.tsx` (404 and 500 variants, with and without `children`)                                                                                                                                                                                                 | developer        | 3            | `AppStatusTemplate.stories.tsx` renders both variants under `Templates/AppStatusTemplate`                                       | `clean-code`                  |
| 9   | DONE   | Verification pass: run `pnpm client lint:check`, `pnpm client build`, `pnpm client build-storybook`; report every command and its real exit status                                                                                                                                              | developer        | 5,6,7,8      | All three commands exit 0; 35 stories present in the built output                                                               | `clean-code`, `security-scanner` |

> No tester sub-agent is spawned: `PROJECT_OVERVIEW.md` sets `Testing Workflow: Skip-Testing` and `Playwright Check: None`.

**Execution shape:** task 1→2→3→4 sequentially by one developer, then tasks 5, 6, 7, 8 by four developer sub-agents **in parallel** (disjoint file sets), then task 9 as a final verification delegation. All developer sub-agents run on the latest Sonnet model per the party-mode delegation rules.
