# Git Conventions

"MR" means merge request.

---

## 1. Branches

Feature branches are `<type>/<kebab-slug>`, where `<type>` is a Conventional Commit type: `feat`,
`fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build` — e.g.
`refactor/client-http-utils-axios`, `chore/version-scripts-husky-hook`.

`backup/*` is the one exception, reserved for maintenance snapshots (e.g. before a risky rebase).

Three long-lived branches, each tied to a deploy environment:

| Branch    | Environment | Script          |
| --------- | ----------- | --------------- |
| `dev`     | development | `start:dev`     |
| `staging` | staging     | `start:staging` |
| `main`    | production  | `start:prod`    |

- **Feature work** forks from `dev` and targets `dev`. Squash-merge, then delete the branch.
- **Promotion** (`dev` → `staging` → `main`) uses a regular merge commit, **never a squash**, and
  the source branch is never deleted. Squashing a promotion rewrites its commits into one that
  doesn't exist upstream, so the branches diverge permanently and every later promotion conflicts.

---

## 2. Commits

`<type>(<scope>): <description>` — scopes are `client`, `server`, `root`; types as in §1.
Example: `refactor(client): move httpUtils onto axios with the fetch adapter`

`husky`'s `pre-commit` hook runs `lint-staged` (ESLint `--fix` on the owning app), then
`pnpm version patch --no-git-tag-version` and re-stages it. Expect a version bump in every commit —
it is automatic, not something to undo.

---

## 3. MRs

- Fill out the repo's MR template; don't leave placeholder text.
- Base branch follows §1: `dev` for feature MRs, `staging`/`main` for promotions.
- **No agent attribution** anywhere in commits or MRs — no `Co-Authored-By:` AI model, no session
  link, no "Generated with…" footer, regardless of a tool's default template. Mirrors
  [AGENT_RULES.md](./AGENT_RULES.md) line 28.
