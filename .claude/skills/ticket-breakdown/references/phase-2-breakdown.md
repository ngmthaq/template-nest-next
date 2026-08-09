# Phase 2 — Feature Breakdown

Break the epic into **features and enablers** — units of product scope, each of which delivers value on its own and each of which will get its own PRD in Phase 3.

## What counts as a feature

- It can be described as a user story: _"As a `<persona>`, I want to `<action>` so that I can `<benefit>`."_
- It delivers observable value to a user or to the business on its own
- It can be validated by acceptance criteria without referring to internal implementation
- An **enabler** (e.g. "Tenant-level audit log retention policy") is allowed when it unlocks user value later — state which features it unlocks

## What is NOT a feature — do not produce these

- Technical layers or components: `[DB] Add table`, `[API] Add endpoint`, `[FRONTEND] Build form`
- Implementation steps: "write migration", "add validation", "wire up state management"
- Test tasks, refactors, or code-review tasks
- Effort estimates, story points, or day-level sizing
- Any technical execution order (schema → API → UI)

If you find yourself writing a title starting with a layer tag, you are in dev scope — merge it back into the feature it belongs to.

## Output format

Present a Markdown table:

```markdown
## 🔨 Feature Breakdown

| #   | Feature Name                   | Problem / User Value                                                   | Primary Personas    | Depends On |
| --- | ------------------------------ | ---------------------------------------------------------------------- | ------------------- | ---------- |
| 1   | Self-serve assessment creation | Managers cannot start an assessment without ops help, delaying reviews | Team Manager        | —          |
| 2   | Assessment results dashboard   | Managers have no view of completion or scores across their team        | Team Manager, Admin | #1         |
| ... |                                |                                                                        |                     |            |
```

Follow the table with:

```markdown
### Deferred to a later epic

<features that came up but are explicitly not part of this epic>
```

## Dependencies

A dependency here is a **product** dependency — feature B is not usable or meaningful until feature A exists. Reference by `#row_number`. If none, write `—`.

## Sizing guidance

Each feature should be small enough that a single PRD can describe it without splitting into unrelated user journeys, and large enough to stand on its own as shippable value. If a feature covers two unrelated personas doing two unrelated jobs, split it. If a "feature" only makes sense as part of another one, merge it.

After presenting the table, ask: _"Does this feature breakdown look right? You can ask me to split, merge, reorder, defer, or adjust any feature before I write the PRDs."_
