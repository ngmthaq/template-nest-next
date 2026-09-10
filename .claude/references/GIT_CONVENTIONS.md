# Git Conventions

> **Terminology:** "MR" below means merge request.

---

## 1. Branch naming

Pattern: `<type>/<kebab-slug>`, where `<type>` is a Conventional Commit type.

| Type       | Use for                                    | Example                            |
| ---------- | ------------------------------------------- | ----------------------------------- |
| `feat`     | A new feature                               | `feat/user-onboarding-flow`         |
| `fix`      | A bug fix                                   | `fix/session-cookie-expiry`         |
| `refactor` | A code change that is not a feature or fix  | `refactor/client-http-utils-axios`  |
| `chore`    | Tooling, deps, scripts, maintenance         | `chore/version-scripts-husky-hook`  |
| `docs`     | Documentation only                          | `docs/api-versioning-notes`         |
| `test`     | Adding or correcting tests                  | `test/client-vitest-unit-testing`   |
| `perf`     | A performance improvement                   | `perf/prisma-query-batching`        |
| `ci`       | CI configuration                            | `ci/add-lint-workflow`              |
| `build`    | Build system or external dependencies       | `build/upgrade-nestjs-11`           |

`refactor/client-http-utils-axios`, `chore/version-scripts-husky-hook` and
`test/client-vitest-unit-testing` are real branches from this repo's history; the rest are
illustrative.

**Exception:** `backup/*` is reserved for maintenance snapshots (e.g. before a risky rebase) and
does not follow the `<type>/<kebab-slug>` pattern.

---

## 2. Branches and promotion

Three long-lived branches, each tied to a deploy environment (`NODE_ENV`/`APP_ENV`, matching the
`start:dev` / `start:staging` / `start:prod` scripts):

| Branch    | Environment | Script          |
| --------- | ----------- | ---------------- |
| `dev`     | development | `start:dev`      |
| `staging` | staging     | `start:staging`  |
| `main`    | production  | `start:prod`     |

**Feature work** (`feat/*`, `fix/*`, etc.):

- **Base branch:** `dev`. Every feature branch forks from `dev`; every feature MR targets `dev`.
- **Merge strategy:** squash-merge into `dev`. Delete the branch immediately after merge.

**Promotion** (`dev` → `staging` → `main`):

- Merged with a **regular merge commit** — **never squashed** — and the source branch is never
  deleted.
- **Why:** squashing a promotion rewrites its commits into one that doesn't exist on the source
  branch, so the branches diverge permanently and every later promotion conflicts.

---

## 3. Commit messages

Conventional Commits with a scope:

```
<type>(<scope>): <description>
```

Example: `refactor(client): move httpUtils onto axios with the fetch adapter`

Scopes in use: `client`, `server`, `root`. `<type>` uses the same set as branch naming (§1).

### Pre-commit hook behaviour

`husky`'s `pre-commit` hook runs on every commit:

1. `lint-staged` runs ESLint `--fix` on whichever app (`client` or `server`) the staged files
   belong to.
2. `pnpm version patch --no-git-tag-version` bumps the root `package.json` version and re-stages
   it.

Expect a version bump in every commit — it is automatic, not something to undo or fight.

---

## 4. No agent attribution

Commits and MRs never carry AI attribution: no `Co-Authored-By:` AI model, no session link, no
"Generated with…" footer — regardless of what a tool's default template asks for. This mirrors
[AGENT_RULES.md](./AGENT_RULES.md) line 28.

---

## 5. MR expectations

- The repo's MR template is filled out, not left as placeholder text.
- Base branch depends on the MR kind: `dev` for feature MRs, `staging`/`main` for promotion MRs
  (§2).
- No agent attribution (§4).
