# Title: Plan — Move the CI config to `.gitlab/ci.yml`

- Classification: `feature`
- Description: Relocate the pipeline config into `.gitlab/` and record the GitLab setting that the move makes mandatory.

---

## Approach Summary / Goal

- Move `.gitlab-ci.yml` → `.gitlab/ci.yml`, content byte-identical. The file is currently untracked (`?? .gitlab-ci.yml`), so this is a plain `mv` with no git history to preserve.
- **The move's whole risk is a setting that cannot be applied yet.** GitLab defaults to a root `.gitlab-ci.yml`; at a custom path it finds nothing and runs **no pipelines, with no error**. The user will set GitLab up later, so the mitigation is writing the requirement down where they will hit it — `CONTRIBUTING.md` already carries a "set this by hand in GitLab" checklist for branch protection, which is the right home.
- **Goal:** the tidier layout, with the silent-failure mode documented rather than left to memory.

## Functional Requirements

- `.gitlab/ci.yml` exists with content identical to the pre-move `.gitlab-ci.yml` (MD5 `aa9ed068aa402e8f5c5c96e1bb10f63e`, 79 lines).
- `.gitlab-ci.yml` no longer exists at the repo root.
- `CONTRIBUTING.md` tells a maintainer to set **Settings → CI/CD → General pipelines → CI/CD configuration file** to `.gitlab/ci.yml`, and states plainly that pipelines silently never run until they do.

## Non-Functional Requirements

- **Zero content change to the pipeline.** Byte-identical, verified by checksum — this is a move, not an edit.
- No new dependencies, no changes to any `package.json`.

## Files in Scope

**Created:** `.gitlab/ci.yml`

**Deleted:** `.gitlab-ci.yml`

**Modified:** `CONTRIBUTING.md`

**Not touched:** `docs/**` (decision records — the prior plan doc keeps saying `.gitlab-ci.yml`, correct for what was approved then), `.claude/skills/**`, everything under `apps/`

## Risks & Assumptions

- **This makes D-02 depend on a second thing going right.** It already cannot go green until `origin` moves to GitLab; now it also needs the config-path setting. Both are documented, neither is verifiable from here.
- The prior plan doc will read as slightly stale, naming `.gitlab-ci.yml`. Deliberate — it records what was approved at the time.
- Assumption: `.gitlab/ci.yml` is the intended filename, per the user's message. `.gitlab/.gitlab-ci.yml` also works if the familiar name is preferred.
- No CI currently runs anywhere, so the move breaks nothing today.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status  | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | ------- | ---- | ---------------- | ------------ | ------------------- | ------ |
| 1 | DONE | Move `.gitlab-ci.yml` to `.gitlab/ci.yml` with no content change | developer | none | `.gitlab/ci.yml` exists; root file gone; MD5 of the new file equals `aa9ed068aa402e8f5c5c96e1bb10f63e` | — |
| 2 | DONE | Add the CI-configuration-path step to `CONTRIBUTING.md`'s GitLab setup instructions, stating the silent-failure consequence | developer | 1 | Names the exact settings path and the value `.gitlab/ci.yml`; says pipelines never run until set; sits with the existing branch-protection steps; all existing links still resolve | `clean-code` |
| 3 | SKIPPED | Automated tests | tester | — | **Justification:** a file move plus one doc paragraph — no executable code. YAML validity and checksum parity are verified by the Root Agent at review. | `aaa-testing` |
