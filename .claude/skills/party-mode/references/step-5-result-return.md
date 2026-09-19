# Step 5 — Sub-Agent Result Return

Developer and tester sub-agents return their results with the **sub-agent result template** below.

If a sub-agent cannot continue without more information, it does not guess. It returns the result with its `Open Questions` section filled in. The Root Agent answers from the approved plan and brainstorming notes, or asks the user when the answer is not written down. Then it delegates again with the answers.

---

## Sub-Agent Result Template

```md
# Title: Result — {short title matching the original delegation title}

- From: developer | tester (sub-agent loaded with the matching role skill)
- To: Root Agent
- Classification: feature | bug
- Description: {one sentence about what was done or why it is not finished}

---

## Goal

- {Repeat the goal of this delegation, so the result makes sense on its own.}

## Status

- [ ] complete
- [ ] incomplete — reason: {brief reason}

## Work Summary

{2–4 sentences about what was done. Be specific — name functions, file paths, tests.}

## Files Changed

| File           | Action                       | Notes                        |
| -------------- | ---------------------------- | ---------------------------- |
| {path/to/file} | created - modified - deleted | {brief note on what changed} |
| …              | …                            | …                            |

## Tasks Completed

| #   | Task               | Outcome                  |
| --- | ------------------ | ------------------------ |
| 1   | {task description} | done - skipped - blocked |
| …   | …                  | …                        |

## Test Results (tester sub-agent only)

| Test        | Type                     | Result                |
| ----------- | ------------------------ | --------------------- |
| {test name} | unit - integration - e2e | pass - fail - skipped |
| …           | …                        | …                     |

## Verification / Checks Run

| Check                                        | Command / How          | Result                |
| -------------------------------------------- | ---------------------- | --------------------- |
| {build - lint - test - secret-scan - manual} | {command run or steps} | pass - fail - not-run |
| …                                            | …                      | …                     |

## Acceptance Criteria

| Task # | Criterion                   | Met                |
| ------ | --------------------------- | ------------------ |
| 1      | {criterion from delegation} | yes - no - partial |
| …      | …                           | …                  |

## Open Questions

{List every question the Root Agent (or the user) must answer before the affected tasks can continue. Be direct and specific — name the task, the decision needed, and the options if any. Never guess instead of asking.}

- Leave empty if none.

## Blockers / Missing Requirements

{List anything that stopped you from finishing. Be exact — unclear blockers cause extra re-planning rounds.}

- Leave empty if status is complete.

## Notes for Root Agent

{Optional: anything you noticed, risks, or next steps the Root Agent should know about.}
```

---

## Usage Notes

- Always set Status clearly — `complete` or `incomplete`. Nothing in between.
- If `incomplete`, the `Blockers` section is required. The Root Agent uses it to delegate again or re-plan.
- If any `Open Questions` are listed, Status must be `incomplete` — the Root Agent answers them (and asks the user when needed), then delegates again with the answers.
- The `Files Changed` table must be full and correct — the Root Agent's review (Step 6) depends on it.
- `Verification / Checks Run` must list **every** check you really ran (build, lint, tests, secret/security scan, manual steps) with its command and result. Give a reason for every `not-run` row — the Root Agent trusts this table instead of running everything again. A `fail` here means Status must be `incomplete`.
- `Acceptance Criteria` links each task's criteria (copied from the delegation) to `yes | no | partial`. Any `no` or `partial` means the task is not done — set Status to `incomplete`.
- Do not mark `complete` if you skipped any task without a clear reason.
