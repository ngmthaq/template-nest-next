# Title: Plan — Finish and verify the pnpm ≥ 12.5.1 migration

- Classification: feature
- Description: Fix the lockfile that keeps changing at its root cause, set the pnpm version in one place, then check CI, Docker, and the commit hook with pnpm 12.

---

## Approach Summary / Goal

- The version bump is already committed (`4707309`). This round closes the gaps that were never checked.
- A developer finds why pnpm 12 adds `@pnpm/exe` to `pnpm-lock.yaml` on `install` and removes it on `exec`/`version`, and fixes it at the source (a setting or config), not with a workaround.
- A developer also makes the root `packageManager` the only place the pnpm version is set, for the Dockerfiles and the client app.
- Goal: with pnpm 12, the CI commands, both Docker builds, and a real commit all work, and the tree stays clean.

## Functional Requirements

- Running `pnpm install --frozen-lockfile`, then `pnpm exec true`, then `pnpm version patch --no-git-tag-version --no-git-checks` leaves `pnpm-lock.yaml` byte-for-byte the same.
- `apps/client/package.json` has no `packageManager` field.
- Both Dockerfiles get the pnpm version from the root `package.json` through `corepack prepare --activate`, with no hardcoded `pnpm@x.y.z`.
- These commands from `.gitlab/ci.yml` pass with pnpm 12.5.1: eslint, typecheck, test (jest/vitest), and build for server and client.
- `docker build -f apps/server/Dockerfile .` and `docker build -f apps/client/Dockerfile .` succeed.
- A real commit that runs the husky pre-commit hook succeeds and leaves `git status` clean.

## Non-Functional Requirements

- No weaker security: `allowBuilds` stays the same (only `bcrypt` and `@swc/core` may run build scripts).
- No new dependencies.
- Keep existing Dockerfile layer caching where possible.

## Files in Scope

- `pnpm-lock.yaml`, `pnpm-workspace.yaml` and/or a new `.npmrc`, plus possibly the root `package.json` (task 1, depends on the root cause)
- `apps/client/package.json` (task 2)
- `apps/server/Dockerfile`, `apps/client/Dockerfile` (task 2)
- `CONTRIBUTING.md` only if the root-cause fix needs a note for developers

## Risks & Assumptions

- Assumption: the `@pnpm/exe` flip comes from pnpm 12 behaviour that a setting can control. If there is no clean fix, the developer reports back and we decide together. No workaround is added silently.
- Risk: the Docker builds may show pnpm 12 problems that CI would also hit, such as `pnpm deploy --legacy` or `prisma` builds being blocked by `allowBuilds: false`. Any such problem comes back to me, and I bring it to you before fixing it.
- Risk: the hook commit test really bumps the version. The tester runs it in a throwaway git worktree on a temporary branch, then removes both, so `refactor/client-feature-based-layout` is not touched.
- Assumption: Docker is running locally (checked: it is).

## Open Questions / Blockers

- Task 1 is blocked by an upstream pnpm bug: pnpm/pnpm#14575 and #14926. The fix, #14958, was merged on 2026-09-21, but no release after v12.5.1 has shipped it. Neither `pmOnFail: ignore` nor `allowBuilds['@pnpm/exe']: true` fixes it. The user chose task 1b instead.

## Status

- [x] Ready to execute
- [ ] Blocked — requires user input on: —

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1b  | DONE   | (Added after task 1 was blocked; the user chose this option.) Change `.husky/pre-commit` to bump the version with `npm version patch --no-git-tag-version` instead of `pnpm version`, and add a short CONTRIBUTING note linking pnpm/pnpm#14926 and #14958: re-pin pnpm once a release after 12.5.1 ships the fix | developer | task 2 | the hook no longer runs any non-install pnpm command; running the hook's version-bump line leaves `pnpm-lock.yaml` unchanged; the note is plain and short | `clean-code` |
| 1   | SKIPPED | (Blocked by upstream pnpm bug; replaced by task 1b.) Find the root cause of `@pnpm/exe` being added to `pnpm-lock.yaml` `packageManagerDependencies` on `install` and removed on `exec`/`version`. Fix it through config and commit the stable lockfile form | developer | none | install → exec → version leaves `pnpm-lock.yaml` unchanged (same md5); `pnpm install --frozen-lockfile` passes; root cause written in the result | `clean-code` |
| 2   | DONE   | Remove `packageManager` from `apps/client/package.json`. In both Dockerfiles, copy `package.json` into the base stage and use `corepack prepare --activate` without a version | developer | none | no `pnpm@` version string left in either Dockerfile or in `apps/client/package.json`; the Dockerfiles still build (checked in task 4) | `clean-code` |
| 3   | DONE   | Run the CI commands from `.gitlab/ci.yml` locally with pnpm 12.5.1: prisma generate, eslint, typecheck, test, and build for server and client | tester | tasks 1, 2 | every command exits 0; output summarized per command | — |
| 4   | DONE   | Run `docker build` for `apps/server/Dockerfile` and `apps/client/Dockerfile` from the repo root | tester | tasks 1, 2 | both builds succeed; the pnpm version inside the image is 12.5.1 | — |
| 5   | DONE   | In a throwaway git worktree on a temporary branch, make a test commit that runs the husky pre-commit hook, then remove the worktree and branch | tester | tasks 1, 2 | hook passes, commit is created, `git status` is clean afterwards, lockfile unchanged; worktree and branch deleted | — |
