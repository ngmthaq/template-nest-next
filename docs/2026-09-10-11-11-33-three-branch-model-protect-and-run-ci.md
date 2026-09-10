# Title: Plan — Three-branch model: protect and run CI on `main`, `dev`, `staging`

- Classification: `feature`
- Description: Adopt a dev → staging → main promotion model: rewrite the branching docs, run CI on all three branches, document tiered protection, then create and push the two new branches.

---

## Approach Summary / Goal

- Adopt the promotion flow chosen by the user: feature branches fork from and **squash**-merge into `dev`; `dev` → `staging` → `main` promote via **regular merge commits**, never squashed, so the branches stay related instead of diverging permanently.
- `GIT_CONVENTIONS.md` §2 currently says the opposite on both counts and gets rewritten. `CONTRIBUTING.md`'s workflow and protection sections follow.
- `.gitlab/ci.yml` moves off `$CI_DEFAULT_BRANCH` to an explicit three-branch match, so the pipeline runs on all three plus merge requests.

**Sequencing issue baked into the task order:** the working tree holds all the uncommitted D-02 work — the CI pipeline, the doc conversions, the spec fix, the `.github` deletion. `main` is still at `59efdc3` (D-01 only). Cutting `dev` and `staging` from `main` before committing would start them without the pipeline that is supposed to run on them. The commit lands first; the branches then fork from a `main` that carries everything.

## Functional Requirements

- `.gitlab/ci.yml` runs on `main`, `dev`, and `staging`, and on merge requests.
- `GIT_CONVENTIONS.md` §2 describes the promotion model, stating explicitly that promotion MRs are **not** squashed, and why.
- `GIT_CONVENTIONS.md:75` no longer claims every MR's base is `main`.
- `CONTRIBUTING.md` workflow (lines 18, 22, 24) targets `dev` for feature work, and documents the promotion path.
- `CONTRIBUTING.md` protection section covers all three branches with tiered rules.
- `dev` and `staging` exist on `origin`, forked from a `main` that contains the D-02 work.

## Non-Functional Requirements

- No new dependencies; no `package.json` changes beyond the pre-commit hook's automatic version bump.
- CI job definitions unchanged — only the `workflow.rules` block changes, so the earlier 9/9 command verification still holds.
- All existing links and anchors keep resolving.

## Files in Scope

**Modified:** `.gitlab/ci.yml`, `.claude/references/GIT_CONVENTIONS.md`, `CONTRIBUTING.md`

**Not touched:** `docs/**`, `.claude/skills/**`, `CODEOWNERS`, everything under `apps/`

## Risks & Assumptions

- **The branches get pushed to GitHub**, the remote being left behind. They will need recreating on GitLab later. The user's explicit choice.
- **Protection itself cannot be applied from here** — a GitLab settings action with no GitLab project yet. `CONTRIBUTING.md` carries the exact rules for all three; the user applies them.
- **`main` is pushed to directly** to land the pending work, which the new rules would forbid. Unavoidable: the rules cannot exist before the commit that introduces them.
- The pre-commit hook bumps the root version and re-stages `package.json`.
- Assumption: `main` stays the default branch even though `dev` becomes the base for feature work.
- Assumption: no per-branch job differences yet — all four stages run identically on all three. Deploy stages are a separate, later task.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status  | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------- | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | TODO | `.gitlab/ci.yml`: replace the `$CI_DEFAULT_BRANCH` rule with an explicit match on `main`, `dev`, `staging`; keep the merge-request rule | developer | none | Valid YAML; all 8 jobs and the `.setup` anchor unchanged; parsed rules show both conditions | `clean-code` |
| 2 | TODO | `GIT_CONVENTIONS.md` §2 (lines 34–35): rewrite for the promotion model — feature branches fork from and squash into `dev`; `dev`→`staging`→`main` promote by merge commit, **explicitly not squashed**, with the divergence reason in one sentence. Update line 75's base-branch claim | developer | none | No stale claim that every MR targets `main`; the no-squash-on-promotion rule is unmissable; §5 anchor slug unchanged | `clean-code` |
| 3 | TODO | `CONTRIBUTING.md`: workflow lines 18/22/24 target `dev`; add the promotion path; replace the single-branch protection list with tiered rules for all three (main: push none / merge maintainers / 1 approval; staging: push none / merge devs+maintainers / 1 approval; dev: push none / merge devs / 0 approvals) | developer | 2 | Three branches each with explicit push, merge, and approval settings; all 5 relative links still resolve; the CI-config-path section stays intact | `clean-code` |
| 4 | TODO | Commit the full working tree to `main` and push; then create `dev` and `staging` from that commit and push both | Root Agent (git ops, not a file edit) | 1, 2, 3 | `origin` has `main`, `dev`, `staging` all at the same SHA; that SHA contains `.gitlab/ci.yml` and the updated docs | — |
| 5 | SKIPPED | Automated tests | tester | — | **Justification:** YAML config and markdown only — no executable code. YAML validity and link resolution verified by the Root Agent at review. | `aaa-testing` |
