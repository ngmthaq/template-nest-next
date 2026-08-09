# Step 5 — Sub-Agent Result Return

Developer and tester sub-agents return results using the **sub-agent result template** below.

A sub-agent that cannot proceed without clarification does not guess — it returns the result with its `Open Questions` section populated. The Root Agent answers from the approved plan and brainstorming context, or asks the user when the answer is not on record, then re-delegates with the answers included.

---

## Sub-Agent Result Template

```md
# Title: Result — {short title matching the original delegation title}

- From: developer | tester (sub-agent loaded with the matching role skill)
- To: Root Agent
- Classification: feature | bug
- Description: {one sentence summarising what was completed or why it is incomplete}

---

## Goal

- {Restate the objective this delegation targeted, so the result reads standalone.}

## Status

- [ ] complete
- [ ] incomplete — reason: {brief reason}

## Work Summary

{2–4 sentences describing what was done. Be specific — reference function names, file paths, test names.}

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

{List every question that must be answered by the Root Agent (or the user) before the affected tasks can proceed. Be direct and specific — name the task, the decision needed, and the options if any. Never guess instead of asking.}

- Leave empty if none.

## Blockers / Missing Requirements

{List anything that prevented full completion. Be precise — vague blockers cause unnecessary re-planning loops.}

- Leave empty if status is complete.

## Notes for Root Agent

{Optional: any observations, risks, or follow-up recommendations the root agent should know about.}
```

---

## Usage Notes

- Status must be set explicitly — `complete` or `incomplete`. No ambiguous states.
- If `incomplete`, the `Blockers` section is mandatory. Root Agent uses this to build the re-delegation or re-planning context.
- If any `Open Questions` are listed, Status must be `incomplete` — the Root Agent answers them (asking the user when needed) and re-delegates with the answers included.
- `Files Changed` table must be complete and accurate — the Root Agent's review (Step 6) relies on it.
- `Verification / Checks Run` must record **every** check actually executed (build, lint, tests, secret/security scan, manual steps) with its command and result. A `not-run` row must be justified — the Root Agent trusts this table instead of re-running everything blind. A `fail` here means Status must be `incomplete`.
- `Acceptance Criteria` maps each assigned task's criteria (copied from the delegation) to `yes | no | partial`. Any `no` or `partial` means the task is not done — set Status `incomplete`.
- Do not mark `complete` if any assigned task was skipped without explicit justification.
