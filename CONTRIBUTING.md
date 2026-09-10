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

1. Branch from `main` using `<type>/<kebab-slug>` (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#1-branch-naming)).
2. Commit using Conventional Commits with a scope (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#3-commit-messages)).
3. Open a PR against `main`, with the PR template filled out (see
   [GIT_CONVENTIONS.md](./.claude/references/GIT_CONVENTIONS.md#5-pr-expectations)).
4. Once approved, it is squash-merged into `main` and the branch is deleted.

### The pre-commit version-bump gotcha

Every commit runs `husky`'s `pre-commit` hook, which — after linting — bumps the root
`package.json` version and re-stages it. This is automatic and expected, but it means **every
commit touches `package.json`**, which routinely causes conflicts when rebasing a branch onto a
moved `main`. Take the higher version number and move on; it is not a real conflict. Full
mechanics: [GIT_CONVENTIONS.md §3](./.claude/references/GIT_CONVENTIONS.md#3-commit-messages).

---

## Branch protection

Not yet configured in this repo — apply by hand once a hosting platform is chosen. CI status
checks will be added here once D-02 (CI pipeline) lands.

### GitHub

1. Settings → Branches → Add branch protection rule, pattern `main`.
2. Require a pull request before merging.
3. Require at least one approval.
4. Disallow direct pushes to `main` (no bypass for anyone, including admins, if possible).
5. Settings → General → Pull Requests: allow **squash merging** only; disable merge commits and
   rebase merging.

### GitLab

1. Settings → Repository → Protected branches: protect `main`, set "Allowed to push" to **No one**
   and "Allowed to merge" to Maintainers (or your reviewer role).
2. Settings → Merge requests: require approval (set the approval count), and enable
   "Pipelines must succeed" once CI exists.
3. Settings → Merge requests → Merge method: set to **Squash commits when merging** (or enforce
   "Squash commits" as required, not just offered) as the only option.
