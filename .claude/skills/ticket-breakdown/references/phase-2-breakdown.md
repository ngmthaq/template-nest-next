# Phase 2 — Feature Breakdown

Split the epic into **features and enablers** — pieces of product scope. Each piece gives value on its own and gets its own PRD in Phase 3.

## What counts as a feature

- It can be described as a user story: _"As a `<persona>`, I want to `<action>` so that I can `<benefit>`."_
- It gives value that you can see to a user or to the business on its own
- It can be checked with acceptance criteria without talking about how the code works inside
- An **enabler** (e.g. "Tenant-level audit log retention policy") is allowed when it makes user value possible later — say which features it makes possible

## What is NOT a feature — do not write these

- Technical layers or components: `[DB] Add table`, `[API] Add endpoint`, `[FRONTEND] Build form`
- Coding steps: "write migration", "add validation", "connect state management"
- Test tasks, refactors, or code-review tasks
- Effort estimates, story points, or sizes in days
- Any technical work order (schema → API → UI)

If you start writing a title with a layer tag, you are in dev scope — merge it back into the feature it belongs to.

## Output format

Show a Markdown table:

```markdown
## 🔨 Feature Breakdown

| #   | Feature Name                   | Problem / User Value                                                   | Primary Personas    | Depends On |
| --- | ------------------------------ | ---------------------------------------------------------------------- | ------------------- | ---------- |
| 1   | Self-serve assessment creation | Managers cannot start an assessment without ops help, delaying reviews | Team Manager        | —          |
| 2   | Assessment results dashboard   | Managers have no view of completion or scores across their team        | Team Manager, Admin | #1         |
| ... |                                |                                                                        |                     |            |
```

After the table, add:

```markdown
### Deferred to a later epic

<features that came up but are clearly not part of this epic>
```

## Dependencies

A dependency here is a **product** dependency — feature B cannot be used or has no meaning until feature A exists. Refer to it by `#row_number`. If there is none, write `—`.

## How big a feature should be

Each feature should be small enough that one PRD can describe it without mixing unrelated user journeys. It should also be big enough to ship on its own and give value. If a feature covers two unrelated personas doing two unrelated jobs, split it. If a "feature" only makes sense as part of another one, merge them.

After you show the table, ask: _"Does this feature breakdown look right? You can ask me to split, merge, reorder, defer, or adjust any feature before I write the PRDs."_
