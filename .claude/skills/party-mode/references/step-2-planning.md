# Step 2 — Planning (Root Agent)

After brainstorming answers every open question, the Root Agent writes the plan **itself** — do not spawn a planner or debugger sub-agent. The plan breaks the work into small tasks. Show the plan to the user **as a chat message** so they can approve it (Step 3) before any code is written.

> Planning is read-only. Do not edit files. Only run commands that read (never change) things. **DO NOT** save the plan to the Doc Directory in this step — the plan is saved to a file only in [Step 3 — User Approval Gate](./step-3-approval-gate.md), after the user approves.

---

## Planning Rules

1. **Plan only when the requirement is clear.** Do not start planning while any question from [Step 1 — Brainstorming](./step-1-brainstorming.md) is still unanswered.
2. **Use every related skill** found during brainstorming — do not plan from memory or guesses.
3. **Link the requirement to real files and modules.** Use real paths. Do not make up files.
4. **Split the work into small tasks.** Each task must be small enough for one sub-agent to finish in one go. Each task must name a file, a function, or a clear output, and must have acceptance criteria that can be tested. Do not write unclear tasks like "Refactor codebase".
5. **Set the role for each task** (`developer` or `tester`) in the `Responsible Role` column, so the delegation prompts can be built straight from the task list.
6. **List risks and assumptions** clearly. Anything you guessed from context — that the user did not say — goes here.
7. **Follow the existing code style.** Use the same patterns, frameworks, and folder structure as the codebase.

### Additional rules for `bug` plans

- **Fix the root cause, not only the symptom.** Every fix plan must explain why the bug happens, not only how to make it stop. A plan that hides the symptom without explaining the real cause is not complete.
- **A regression test is required.** Every fix plan must have a tester task that adds a test. The test must fail on the old (buggy) code and pass after the fix.
- **Do not break existing behaviour.** List any callers, edge cases, or related code the fix may affect. Point out any risk of breaking old behaviour (backward compatibility).
- **More than one possible root cause?** Do not pick one without telling the user. Go back to brainstorming and ask the user which one matches what they saw.

---

## Plan Template

Show the full plan to the user **in a chat message** using this template — do not save it to a file yet. Fill in every section.

```md
# Title: Plan — {short title matching the original request}

- Classification: feature | bug
- Description: {one sentence about the proposed approach}

---

## Approach Summary / Goal

- {2–4 short sentences on how you will build or fix it, and why you chose this way.}
- {For a bug: state the real root cause, not only the symptom.}
- {Goal}

## Functional Requirements

- {List what the feature or fix must do for this plan to succeed. Each item must be testable.}

## Non-Functional Requirements

- {List any needs about speed, security, ease of maintenance, or other quality needs for this plan.}

## Files in Scope

- {List all files expected to be created, modified, or deleted}

## Risks & Assumptions

- {List any assumptions made during planning}
- {List any risks the user should be aware of}

## Open Questions / Blockers

> **Rule: ALWAYS tell the user about anything unclear. Never guess.**
> If any task, requirement, or design choice is still unclear, list it here and go back to brainstorming. Do not start work while blockers are still open.

- {List questions the user must answer before work starts}
- {List any blockers that stop a task from being planned correctly}
- Leave empty if none.

## Status

- [ ] Ready to execute
- [ ] Blocked — requires user input on: {describe each blocker clearly}

## Task List

{Ordered list of small tasks. Each task belongs to one sub-agent.}

| #   | Status | Task               | Responsible Role | Dependencies | Acceptance Criteria    | Skills        |
| --- | ------ | ------------------ | ---------------- | ------------ | ---------------------- | ------------- |
| 1   | WIP    | {task description} | developer        | none         | {what done looks like} | `clean-code`  |
| 2   | TODO   | {task description} | tester           | task 1       | {what passing means}   | `aaa-testing` |
| …   | …      | …                  | …                | …            | …                      | …             |

> **Note:** Tasks must be small and clear. Do not write unclear tasks like "Refactor codebase" — split them into exact changes to files or functions. Each task must have:
>
> - a `Responsible Role` (developer or tester), so the Root Agent can build delegation prompts straight from the task list;
> - testable `Acceptance Criteria` (copied as-is into the delegation's `Tasks Assigned` table and checked again at Step 6);
> - the related skills to use while doing the task.

> **Note:** Status field in `Task List` includes:

- `TODO` for tasks not yet started
- `WIP` for tasks currently in progress
- `BLOCKED` for tasks that cannot move forward because of an open issue (link to the blocker in the Blockers section)
- `SKIPPED` for tasks left out on purpose in this round (say why)
- `DONE` for completed tasks
```

---

## Usage Notes

- Every task in the Task List must have a `Responsible Role` (developer or tester) — the Root Agent picks the matching rows when building the [developer](./developer.md#delegation-prompt-template) and [tester](./tester.md#delegation-prompt-template) delegation prompts.
- **ALWAYS set Status to `Blocked` and list every open question** when anything is unclear — do not plan around missing information or guess. Go back to [Step 1 — Brainstorming](./step-1-brainstorming.md) to resolve them with the user.
- The Root Agent **MUST** show the full plan to the user **as a chat message only** — do not write it to the Doc Directory in this step. **ALWAYS read Step 3 — User Approval Gate** to learn how to handle the user's choice and when the plan is saved to a file. See [Step 3 — User Approval Gate](./step-3-approval-gate.md).
- If Status is `Blocked`, the Root Agent must ask the user before proceeding to Step 4. Execution must not begin with unresolved blockers.
- At Step 6 the Root Agent checks the finished work against this plan — so keep requirements and acceptance criteria exact enough to check against.

---

## Minimum Skill References

Apply, at minimum, on every plan:

- [clean-code](../../clean-code/SKILL.md) — code quality rules to follow in the plan
- [testing-workflow](./tester.md#testing-workflow) — testing workflow rules

Also use any other skills found during brainstorming.
