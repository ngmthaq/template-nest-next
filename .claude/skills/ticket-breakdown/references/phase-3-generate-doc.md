# Phase 3 — Generate a PRD per Feature

Write one PRD markdown file **per feature** approved in Phase 2. The PRD is the single source of truth for the engineering team and is what a technical specification will later be generated from.

## File path

Write the files flat into the **Doc Directory** (see `references/PROJECT_OVERVIEW.md`, defaults to `/docs`) — no sub-folders:

```
<Doc Directory>/yyyy-mm-dd-<summary>-prd.md
```

- `yyyy-mm-dd` = date the PRD is written (e.g. `2026-08-07`)
- `<summary>` = kebab-case slug of the feature name (max 6 words, lowercase, no special chars)

**Example:** `/docs/2026-08-07-self-serve-assessment-creation-prd.md`

## PRD template

```markdown
# <Feature Name>

## Epic

- **Epic PRD:** <link or path to the parent epic document, or the ticket ID/URL>
- **Epic Architecture:** <link or path if one exists, otherwise `N/A`>

## Goal

**Problem:** <3–5 sentences describing the user problem or business need this feature addresses>

**Solution:** <how this feature solves that problem>

**Impact:** <expected outcomes or metrics to be improved — e.g. user engagement, conversion rate, time-to-complete>

## User Personas

<the target user(s) for this feature, and what each one is trying to accomplish>

## User Stories

- As a `<user persona>`, I want to `<perform an action>` so that I can `<achieve a benefit>`.
- ...

<cover the primary paths and the edge cases>

## Requirements

### Functional Requirements

- <what the system must do — specific, unambiguous, observable behaviour>
- ...

### Non-Functional Requirements

- <constraints and quality attributes: performance, security, accessibility, data privacy>
- ...

## Acceptance Criteria

### <User story or requirement it covers>

- [ ] Given <context>, when <action>, then <observable outcome>
- [ ] ...

### <Next user story or requirement>

- [ ] ...

## Out of Scope

- <what is explicitly not included in this feature>
- ...
```

## Rules

- **One file per feature** — do not merge several features into a single PRD
- **No implementation detail** — no schemas, endpoints, libraries, file names, or architecture. If a requirement can only be stated in technical terms, restate it as observable behaviour
- **Every user story gets acceptance criteria** — a story with no AC is unfinished
- **Out of Scope is never empty** — if nothing is excluded, say so explicitly and note the boundary with adjacent features
- Cross-reference sibling features by their PRD path when a dependency exists

## After writing

Present a summary of what was written:

```markdown
## 📄 PRDs Generated

| #   | Feature                        | Path                                                   |
| --- | ------------------------------ | ------------------------------------------------------ |
| 1   | Self-serve assessment creation | /docs/2026-08-07-self-serve-assessment-creation-prd.md |
| 2   | Assessment results dashboard   | /docs/2026-08-07-assessment-results-dashboard-prd.md   |
```

Then ask: _"PRDs saved ✅. Shall I proceed to create the feature tickets in your ticket system?"_
