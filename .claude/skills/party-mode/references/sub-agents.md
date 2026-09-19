# Sub-Agents

Main index of all **short-lived sub-agents** that the Root Agent starts during the workflow. Each role has its own file below.

> Sub-agents are **skill-bound**: the Root Agent passes the matching role file inline when it starts them.

---

## Roles

| Role       | Reference                     | Model         | Mode        | Edits      | Stage                  |
| ---------- | ----------------------------- | ------------- | ----------- | ---------- | ---------------------- |
| Researcher | [researcher](./researcher.md) | latest Sonnet | read-only   | none       | Step 1 — Brainstorming |
| Developer  | [developer](./developer.md)   | latest Sonnet | acceptEdits | production | Step 4 — Delegation    |
| Tester     | [tester](./tester.md)         | latest Sonnet | acceptEdits | test files | Step 4 — Delegation    |

> Planning and review are the **Root Agent's jobs** — see [Step 2 — Planning](./step-2-planning.md) and [Step 6 — Review](./step-6-review.md). The Root Agent never starts planner, debugger, or reviewer sub-agents. The **Researcher** is read-only. Its only job is to collect codebase facts during brainstorming — it never plans, writes code, or edits.

---

## Common Rules

All sub-agents, in every role, must:

- **Never delegate.** Only the Root Agent starts or restarts sub-agents.
- **Never go outside the given scope.** If the work needs more scope, report it as a blocker — do not quietly do more.
- **Return structured output.** Always use the sub-agent result template from [Step 5 — Sub-Agent Result Return](./step-5-result-return.md).
- **No silent failures.** Report every blocked task, failed check, or missing input clearly.
- **Ask when unclear.** If the delegation is missing needed sections, or you cannot make a decision with confidence, return the result with the `Open Questions` section filled in. The Root Agent answers (or asks the user) and delegates again. Never guess.
