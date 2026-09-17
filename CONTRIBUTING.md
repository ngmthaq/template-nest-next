# Contributing

Thanks for contributing to `template-nest-next`. This is the human entry point; it links out to
the exact rules rather than restating them.

---

## Setup

See [README.md](./README.md) for install and run instructions. In short: Node.js `>= 24`, pnpm
`10.25.0` (pinned in `package.json`'s `packageManager`, picked up by `corepack enable`), then
`pnpm install`.

---

## Contribution workflow

1. Branch from `dev` using `<type>/<kebab-slug>` (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#1-branches)).
2. Commit using Conventional Commits with a scope (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#2-commits)).
3. Open an MR against `dev`, with the MR template filled out (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#3-mrs)).
4. Once approved, it is squash-merged into `dev` and the branch is deleted.

### Getting to production

Work reaches production by promotion: `dev` → `staging` → `main`, each step a regular merge
commit — never squashed. See [GIT_CONVENTIONS.md §1](./.claude/references/GIT_CONVENTIONS.md#1-branches)
for the full rule and why squashing a promotion is a mistake.

### The pre-commit version-bump gotcha

Every commit runs `husky`'s `pre-commit` hook, which — after linting — bumps the root
`package.json` version and re-stages it. This is automatic and expected, but it means **every
commit touches `package.json`**, which routinely causes conflicts when rebasing a branch onto a
moved `main`. Take the higher version number and move on; it is not a real conflict. Full
mechanics: [GIT_CONVENTIONS.md §2](./.claude/references/GIT_CONVENTIONS.md#2-commits).

---

## CI

The same four stages — lint, typecheck, test, build, each covering both apps — run on both hosts.
Keep the two configs in sync when you change either.

| Host   | Config                     | Runs on                           |
| ------ | -------------------------- | --------------------------------- |
| GitLab | `.gitlab/ci.yml`           | `main`, `dev`, `staging`, and MRs |
| GitHub | `.github/workflows/ci.yml` | pushes to those branches, and PRs |

GitHub Actions picks its workflow up automatically. **GitLab does not:** the config lives at
`.gitlab/ci.yml`, not the repo root, so set **Settings → CI/CD → General pipelines → CI/CD
configuration file** to `.gitlab/ci.yml` by hand. Skip this and GitLab runs **no pipelines at all,
with no error** — do it before relying on any of the branch protection steps below.

## Branch protection

Not yet applied in this repo — set the following by hand in GitLab, per branch, in
**Settings → Repository → Protected branches**:

| Branch    | Allowed to push | Allowed to merge         | Approvals |
| --------- | --------------- | ------------------------ | --------- |
| `main`    | No one          | Maintainers              | 1         |
| `staging` | No one          | Developers + Maintainers | 1         |
| `dev`     | No one          | Developers               | 0         |

In **Settings → Merge requests**:

- Require the approval counts above (per-branch approval rules, or a single rule set to the
  highest count with per-branch overrides), and enable **"Pipelines must succeed"** once CI
  exists.
- Merge method: **Squash commits when merging** as the default for feature MRs into `dev`. Do
  **not** enable it repo-wide as a forced/required setting — that would also force-squash
  `dev`→`staging`→`main` promotion MRs, which is exactly the mistake
  [GIT_CONVENTIONS.md §1](./.claude/references/GIT_CONVENTIONS.md#1-branches) warns
  against. Leave squash as an option, defaulted on, and uncheck it on every promotion MR.
