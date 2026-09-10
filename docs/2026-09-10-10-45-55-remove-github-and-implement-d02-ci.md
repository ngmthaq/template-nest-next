# Title: Plan — Remove `.github`, purge hosting references, and implement D-02 (CI pipeline)

- Classification: `feature`
- Description: Delete `.github/`, convert the four hosting-reference sites to GitLab-only, add the missing server `typecheck` script, fix the type error blocking it, and add a four-stage `.gitlab-ci.yml`.

---

## Approach Summary / Goal

- Scope covers **Group A only** — the five hosting references in four files. Historical plan docs stay as decision records; vendored skills and third-party URLs stay untouched, since deleting them would break Storybook stories and strip GitHub-token detection out of `security-scanner`.
- `GIT_CONVENTIONS.md` and `CONTRIBUTING.md` move to **MR / merge request** terminology. This changes the `#5-pr-expectations` anchor to `#5-mr-expectations`, and `CONTRIBUTING.md:23` links to it — so both files must change together or the link breaks.
- All four CI stages were run locally before planning. **Three are green; typecheck fails** on the server, in a test file — so D-02 cannot ship without a tester fix first.
- `apps/server/src/generated/` is gitignored with zero files tracked, so `prisma generate` must run in `before_script` for every job, not just build.
- **Goal:** a `.gitlab-ci.yml` whose every command is proven locally, plus a repo with no stale GitHub hosting claims.

## Baseline measured before planning

| Stage | Server | Client |
| --- | --- | --- |
| lint | pass | pass |
| typecheck | **FAIL** — `TS2345` at `websocket.adapter.spec.ts:46` | pass |
| unit test | pass 71/71 | pass 170/170 |
| build | pass (needs `prisma generate` on clean checkout) | pass, no env needed |

Root cause of the typecheck failure: `tsconfig.build.json` excludes `**/*spec.ts`, so `nest build` never sees the error, while `tsc --noEmit` (using `tsconfig.json`) does.

## Functional Requirements

- `.github/` absent.
- No reference to `.github/` or GitHub-as-host in `.gitlab/merge_request_templates/default.md`, `CONTRIBUTING.md`, `CODEOWNERS`, or `GIT_CONVENTIONS.md`.
- `GIT_CONVENTIONS.md` uses MR terminology at all 5 sites (lines 3, 34, 66, 72, 74); `CONTRIBUTING.md` at lines 22–23; the `#5-mr-expectations` anchor resolves.
- `apps/server/package.json` has a `typecheck` script; `tsc --noEmit` exits 0.
- `.gitlab-ci.yml` defines `lint`, `typecheck`, `test`, `build`, each covering **both** apps, on Node 24 + pnpm 10.25.0, `--frozen-lockfile`, `prisma generate` in `before_script`, triggering on `main` and merge requests.

## Non-Functional Requirements

- No new dependencies. No production source changes — only scripts, one spec, CI config, docs, deletions.
- Valid YAML, verified by parsing at review.
- Every CI command identical to one verified locally.

## Files in Scope

**Created:** `.gitlab-ci.yml`

**Modified:** `apps/server/package.json`, `apps/server/src/core/websocket/websocket.adapter.spec.ts`, `.gitlab/merge_request_templates/default.md`, `.claude/references/GIT_CONVENTIONS.md`, `CONTRIBUTING.md`, `CODEOWNERS`

**Deleted:** `.github/pull_request_template.md` and the `.github/` directory

**Explicitly not touched:** `docs/**` (decision records), `.claude/skills/**`, `apps/client/src/libs/shadcn-ui/avatar.stories.tsx`, `apps/client/.gitignore`, `apps/client/README.md`

## Risks & Assumptions

- **D-02's acceptance criterion cannot be met.** "Green pipeline on main" needs a GitLab remote; `origin` is GitHub. Commands are proven to pass; a pipeline run is not. **D-02 stays unticked.**
- **This supersedes the earlier "fix only what dangles" choice** — `CONTRIBUTING.md` and `GIT_CONVENTIONS.md` lose their GitHub halves, reversing the hedge from the D-01 round. Deliberate, on the user's instruction.
- **The anchor rename is the one fragile edit.** Tasks 6 and 7 must land together; if only one does, `CONTRIBUTING.md:23` points at a heading that no longer exists.
- Local verification ran on **Node v22.22.2**, not the Node 24 CI pins — strong evidence, not proof.
- Deleting `.github/pull_request_template.md` reverses a file pushed to `origin/main` earlier the same day.
- The spec fix is assumed to be a type annotation, not a behaviour change — the test passes at runtime today.
- `image: node:24` plus corepack assumed correct; a private runner or registry would need a different `image:`.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------ | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | DONE | Fix `TS2345` at `apps/server/src/core/websocket/websocket.adapter.spec.ts:46` — type the `createIOServer` options argument | tester | none | `tsc --noEmit` exits 0; all 71 server tests still pass; assertion meaning unchanged | `aaa-testing` |
| 2 | DONE | Add `"typecheck": "tsc --noEmit"` to `apps/server/package.json` | developer | none | Script present beside `lint:check`; `pnpm server typecheck` resolves | `clean-code` |
| 3 | DONE | Delete `.github/pull_request_template.md` and the `.github/` directory | developer | none | `.github/` absent; deletion staged as a removal | — |
| 4 | DONE | Rewrite the mirror comment in `.gitlab/merge_request_templates/default.md:1` | developer | 3 | No `.github/` reference remains; body otherwise byte-identical | `clean-code` |
| 5 | DONE | Create `.gitlab-ci.yml` — 4 stages, both apps each, Node 24, corepack + pnpm 10.25.0, `--frozen-lockfile`, `prisma generate` in `before_script`, pnpm store cached, rules for `main` + MRs | developer | 2 | Valid YAML; 4 stages; every command matches one verified locally; no stage omits either app | `clean-code` |
| 6 | DONE | `GIT_CONVENTIONS.md`: GitLab-only terminology note (line 3), PR→MR at lines 34, 66, 72, 74; §5 heading becomes `MR expectations` | developer | none | No "GitHub" or "pull request" remains; every other rule unchanged | `clean-code` |
| 7 | DONE | `CONTRIBUTING.md`: PR→MR at lines 22–23, anchor → `#5-mr-expectations`, delete the `### GitHub` subsection (lines 41–47), refresh the stale "once a hosting platform is chosen" sentence | developer | 6 | GitLab subsection intact; all 4 relative links and anchors resolve against the task-6 file | `clean-code` |
| 8 | DONE | `CODEOWNERS`: line 2 → GitLab-only wording; delete the GitHub enforcement line 4 | developer | none | No GitHub reference; GitLab paid-tier note kept; rules still all commented; comment blocks ≤2 lines | — |

**Delegation shape:** tester (task 1) ‖ developer A (2–5) ‖ developer B (6–8) — three sub-agents in parallel, no file-scope overlap.
