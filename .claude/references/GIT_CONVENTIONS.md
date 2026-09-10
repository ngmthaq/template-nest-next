# Git Conventions

> **Terminology:** "PR" below means pull request on GitHub, merge request on GitLab.

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

## 2. Base branch and merge strategy

- **Base branch:** `main`. Every branch forks from `main`; every PR targets `main`.
- **Merge strategy:** squash-merge into `main`. Delete the branch immediately after merge.

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

Commits and PRs never carry AI attribution: no `Co-Authored-By:` AI model, no session link, no
"Generated with…" footer — regardless of what a tool's default template asks for. This mirrors
[AGENT_RULES.md](./AGENT_RULES.md) line 28.

---

## 5. PR expectations

- The repo's PR template is filled out, not left as placeholder text.
- Base branch is `main`.
- No agent attribution (§4).
