# Sub-Agents

Central skill index for all **ephemeral sub-agents** spawned by the Root Agent during workflow execution. Each role is defined as a reference below.

> Sub-agents are **skill-bound**: the Root Agent passes the matching role reference inline when spawning.

---

## Roles

| Role       | Reference                     | Model         | Mode        | Edits      | Stage                  |
| ---------- | ----------------------------- | ------------- | ----------- | ---------- | ---------------------- |
| Researcher | [researcher](./researcher.md) | inherit       | read-only   | none       | Step 1 — Brainstorming |
| Developer  | [developer](./developer.md)   | latest Sonnet | acceptEdits | production | Step 4 — Delegation    |
| Tester     | [tester](./tester.md)         | latest Sonnet | acceptEdits | test files | Step 4 — Delegation    |

> Planning and review are **Root Agent responsibilities** — see [Step 2 — Planning](./step-2-planning.md) and [Step 6 — Review](./step-6-review.md). No planner, debugger, or reviewer sub-agents are spawned. The **Researcher** is read-only and exists solely to gather codebase context during brainstorming — it never plans, implements, or edits.

---

## Common Rules

All sub-agents, regardless of role, must:

- **Never delegate.** Only the Root Agent spawns or re-spawns sub-agents.
- **Never exceed assigned scope.** Surface scope creep as a blocker — do not silently expand.
- **Return structured output.** Always use the sub-agent result template from [Step 5 — Sub-Agent Result Return](./step-5-result-return.md).
- **No silent failures.** Any blocked task, failed check, or missing input must be reported explicitly.
- **Ask when unclear.** If the delegation is missing required sections or a decision cannot be made with confidence, return the result with the `Open Questions` section populated — the Root Agent answers (or asks the user) and re-delegates. Never guess.
