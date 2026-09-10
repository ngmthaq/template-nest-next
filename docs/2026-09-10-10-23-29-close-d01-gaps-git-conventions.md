# Title: Plan — Close the D-01 gaps (branch/commit/PR conventions, CODEOWNERS, contribution guide)

- Classification: `feature`
- Description: Add the four missing D-01 artifacts — a canonical git-conventions reference under `.claude/references/`, a human-facing `CONTRIBUTING.md`, PR/MR templates for both GitHub and GitLab, and a root `CODEOWNERS` skeleton — with no new dependencies and no commit-message enforcement.

---

## Approach Summary / Goal

- The rules that already exist (Conventional Commits, branch prefixes) live in `.claude/references/CODING_CONVENTIONS.md` §18 and in the branch names themselves. Per Q3, the canonical home becomes a new `.claude/references/GIT_CONVENTIONS.md`, linked from `.claude/CLAUDE.md` alongside the three existing reference sections.
- To avoid two sources of truth, §18 of `CODING_CONVENTIONS.md` is **moved** into the new file and replaced with a one-line pointer, matching how `CLAUDE.md` already delegates to references rather than restating them.
- Because the host platform is undecided, every artifact is written **platform-neutral where possible and duplicated where not**. `CODEOWNERS` goes to the repo root, valid on both. The request template is the one genuinely forked artifact: `.github/pull_request_template.md` and `.gitlab/merge_request_templates/default.md` with identical bodies. The `create-pull-request` skill resolves platform from `git remote get-url origin` *before* looking for a template, so exactly one is ever found — no ambiguity, no prompt.
- `CONTRIBUTING.md` at the repo root is the human-facing half, thin, linking to `GIT_CONVENTIONS.md` for the exact rules, and carrying branch-protection steps **for both platforms** (Q4) for you to apply by hand.
- **Goal:** every D-01 sub-item satisfiable by a file in this repo is satisfied, on whichever platform you land on, leaving only the manual settings step.

## Functional Requirements

- `.claude/references/GIT_CONVENTIONS.md` documents: branch naming, base branch, merge strategy, Conventional Commit format with scopes `client`/`server`/`root`, the no-agent-attribution rule, and PR expectations.
- It opens with a one-line terminology note — *"PR" below means pull request on GitHub, merge request on GitLab* — so the rest of the doc reads cleanly without `PR/MR` clutter on every line.
- `.claude/CLAUDE.md` gains a `GIT CONVENTIONS` section linking the new file, in the format of the existing three.
- `CODING_CONVENTIONS.md` §18 points to `GIT_CONVENTIONS.md` instead of duplicating it.
- `.github/pull_request_template.md` and `.gitlab/merge_request_templates/default.md` both exist with identical bodies, each at the exact path its platform (and the `create-pull-request` skill) auto-discovers.
- `CODEOWNERS` at the **repo root** — valid on GitHub and GitLab both — with commented example rules and no owners assigned.
- `CONTRIBUTING.md` links `GIT_CONVENTIONS.md` and lists branch-protection steps for both platforms.
- `README.md` links `CONTRIBUTING.md`.

## Non-Functional Requirements

- **No new dependencies.** No commitlint, no `commit-msg` hook, no `package.json` change.
- **No duplication of rules.** The two request templates are a deliberate exception, mirrored by necessity.
- **Zero behaviour change.** Documentation and platform metadata only.
- Markdown matches the existing reference docs: `#` title, `---` separators, tables for enumerable rules.

## Files in Scope

**Created**

- `.claude/references/GIT_CONVENTIONS.md`
- `CONTRIBUTING.md`
- `CODEOWNERS` — repo root
- `.github/pull_request_template.md`
- `.gitlab/merge_request_templates/default.md`

**Modified**

- `.claude/CLAUDE.md`, `.claude/references/CODING_CONVENTIONS.md`, `README.md`

**Deliberately not modified**

- `docs/project-kickoff-checklists-dev-ba-qc.md` — D-01's output includes *"repo with protected branches"*, which only the user can apply. It stays `☐` until then.

## Risks & Assumptions

Two defaults inferred from the repo:

1. **Branch naming** — `<type>/<kebab-slug>`, `<type>` being a Conventional Commit type (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`). Matches existing branches. `backup/*` documented as a maintenance exception.
2. **Merge strategy** — squash-merge into `main`, branch deleted after. History is linear, consistent with this but not proof.

Risks:

- **Template drift.** Two request templates will diverge the moment someone edits one. Mitigation: each carries a one-line comment naming the other as its mirror. A convention, not enforcement — accepted cost of platform-hedging.
- **GitLab Code Owners is a paid-tier feature.** On Free the root `CODEOWNERS` is inert — still worth having, since it is free to carry and works immediately on GitHub.
- **`origin` still points at GitHub.** Until it changes, GitLab-side artifacts are dormant. Nothing breaks.
- Moving §18 is one step past a literal "create a md file" — it is the anti-duplication measure.
- The pre-commit `pnpm version patch` bump is a real contributor gotcha and will be documented in `CONTRIBUTING.md`.
- `.github/` and `.gitlab/` do not exist yet; this creates both. D-02/D-03 (CI, SAST) will later add workflow files — out of scope.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status  | Task                                                                                                                                                                                                 | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                            | Skills                 |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | DONE    | Create `.claude/references/GIT_CONVENTIONS.md` — terminology note, branch naming table, base branch + merge strategy, Conventional Commit format with scopes, no-agent-attribution rule, PR expectations | developer        | none         | Every rule from `CODING_CONVENTIONS.md` §18 preserved; no rule stated in more than one file; terminology note present; wording works for both platforms          | `clean-code`           |
| 2   | DONE    | Replace `CODING_CONVENTIONS.md` §18 body with a pointer to `GIT_CONVENTIONS.md`                                                                                                                        | developer        | 1            | §18 heading kept; body is a single link line; no git rule lost in the move                                                                                       | `clean-code`           |
| 3   | DONE    | Add a `GIT CONVENTIONS` section to `.claude/CLAUDE.md` linking `./references/GIT_CONVENTIONS.md`                                                                                                        | developer        | 1            | Matches the format of the existing three sections; relative link resolves                                                                                        | —                      |
| 4   | DONE    | Create `.github/pull_request_template.md` from `.claude/skills/create-pull-request/references/pull-request-template.md`, adapted to this monorepo (client/server scope checkboxes)                       | developer        | none         | Exact lowercase path; mirror comment naming the GitLab file                                                                                                      | `create-pull-request`  |
| 5   | DONE    | Create `.gitlab/merge_request_templates/default.md` with a body identical to task 4                                                                                                                    | developer        | 4            | Body matches task 4 verbatim except the mirror comment, which names the GitHub file; path is exactly what GitLab and the skill discover                          | `create-pull-request`  |
| 6   | DONE    | Create root `CODEOWNERS` skeleton                                                                                                                                                                      | developer        | none         | Valid syntax on both platforms; all rules commented out; examples for `/apps/server/`, `/apps/client/`, `/.claude/`; header notes owners to be filled in and that GitLab enforcement needs a paid tier | —                      |
| 7   | DONE    | Create root `CONTRIBUTING.md` — setup pointer, branch/commit/PR workflow linking `GIT_CONVENTIONS.md`, pre-commit version-bump gotcha, and a "Branch protection" section with separate GitHub and GitLab settings paths | developer        | 1            | Contributor can go clone → merged PR using this file plus its links; protection steps actionable on either platform                                              | `clean-code`           |
| 8   | DONE    | Add a `Contributing` link to `README.md`                                                                                                                                                               | developer        | 7            | Link present and resolves                                                                                                                                        | —                      |
| 9   | SKIPPED | Automated tests                                                                                                                                                                                        | tester           | —            | **Justification:** markdown and platform metadata only — no executable code, nothing a unit or integration test can assert. Link resolution, CODEOWNERS syntax, and template parity are verified by the Root Agent at Step 6 review instead. | `aaa-testing`          |
