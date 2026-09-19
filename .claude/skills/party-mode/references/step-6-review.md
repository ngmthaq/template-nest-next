# Step 6 — Review (Root Agent)

The Root Agent reviews the developer and tester work itself — it does not start a reviewer sub-agent. The review checks the work against the **approved plan**, project **conventions**, **security**, and **business logic**. It is the last check before the user gets the result.

> Review is read-only. No file edits, no test writing, and no commands except read-only checks and the required skill checks.

---

## Routing

| Sub-agent result                            | Root Agent action                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Open Questions` present                    | Answer from the plan/brainstorming notes — or ask the user — then delegate again (**Step 4**) with answers |
| `incomplete` or `blocked`                   | Fix the blocker (re-plan with **Step 1/2** if the plan is wrong), then delegate again (**Step 4**)         |
| `complete` — review **not fully qualified** | Go back to **Step 4**: start again the sub-agent named in each issue's `Responsible Role`, with feedback   |
| `complete` — review **accepted**            | Go to **Step 7** (summary report)                                                                          |

---

## Review Workflow

1. **Check the `Status` the sub-agent reported first.** If any sub-agent result is `incomplete` or `blocked`, or has `Open Questions`, deal with those before you review quality — see the routing table above.
2. **Check against the approved plan and the original user request.** Read the original user prompt word for word and the approved plan. The work must meet both — a delegation summary can move away from what the user wanted.
3. **Look at every file in the `Files Changed` tables.** Do not trust the sub-agent summaries alone — read the real code and tests.
4. **Check the `Acceptance Criteria` and `Verification / Checks Run` tables.** Every criterion must be `yes`. Any `no`/`partial` fails the review. Run again any check the sub-agent marked `not-run` and any key check (always security/secret scans). Confirm the reported `pass` results are real — a pass the sub-agent reports is a claim, not proof.
5. **Check project conventions.** Naming, folder structure, patterns, frameworks, and every skill assigned in the delegation must be followed.
6. **Check security.** Run the executable skill checks on the diff — a failing check is automatically a fail.
7. **Check business logic.** Follow the changed code paths and compare them with the plan's functional requirements: correct behaviour, edge cases handled, no side effects or regressions you did not want.
8. **Check tests.** Tests cover the needed cases (happy path, edge cases, failure cases), they pass, and — for bug fixes — they include the required regression test.
9. **On a second review, check that each old issue is fixed.** Go through the last review's issue list and confirm a real change fixes each one. Issues that are still there still fail.
10. **Decide.** Use `accepted` only if every checklist item passes and no critical or high issue is left. If not, go back to Step 4 with review feedback.

---

## Checklist

| Item                                                  | Result                |
| ----------------------------------------------------- | --------------------- |
| Satisfies the approved plan and original requirement  | pass - fail - partial |
| Every task's Acceptance Criteria met                  | pass - fail - partial |
| Verification / checks confirmed again (not just said) | pass - fail - partial |
| Follows project conventions and skill references      | pass - fail - partial |
| No unwanted side effects or regressions               | pass - fail - partial |
| Tests cover required scenarios and pass               | pass - fail - partial |
| No security, performance, or maintainability issues   | pass - fail - partial |

- There are only two results: `accepted` or `not qualified` — never "accepted with issues".
- `critical` or `high` issues always fail the review. The Root Agent may accept `medium` or `low` issues, but must list them in the summary report as recommendations.
- Anything `partial` must be fixed before you accept, or it fails the review. No quiet passes.

---

## Review Feedback (when not qualified)

For each issue, write enough detail so the sub-agent can fix it without asking more questions. Add a `Responsible Role` so the right sub-agent gets it:

| #   | Severity                       | File           | Responsible Role   | Description                      |
| --- | ------------------------------ | -------------- | ------------------ | -------------------------------- |
| 1   | critical - high - medium - low | {path/to/file} | developer - tester | {clear description of the issue} |
| …   | …                              | …              | …                  | …                                |

> **Note:** Do not write unclear feedback like "Code quality is poor". Be specific instead: "Function `calculateTotal` in `billing.js` has a cyclomatic complexity of 15, which is above our limit of 10." Paste the related rows into the `Review Feedback` section of the new delegation prompt.

---

## Rules

- **No silent failures.** Show and fix every `incomplete`, `blocked`, or open question — never hide it.
- The Root Agent never fixes issues itself — every fix goes back to the responsible sub-agent.
- Follow the loop guard: after **2 failed reviews in a row** on the same work, show the results to the user and ask whether to continue or stop.

---

## Minimum Skill References

Use at least these on every review:

- [clean-code](../../clean-code/SKILL.md) — code review checklist
- [testing-workflow](./tester.md#testing-workflow) — testing workflow principles
- [security-scanner](../../security-scanner/SKILL.md) — must be run on the diff before any `accepted` decision; its secrets scan (`scan-secrets.sh --diff`) must exit `0`

Also check every other skill that was given in the delegations.
