# Phase 3 — Generate a PRD per Feature

Write one PRD markdown file **for each feature** approved in Phase 2. Also write **one overview file** that lists every PRD, so you can track the progress of the whole epic in one place. The PRD is the one source of truth for the engineering team. Later, the team writes a technical spec from it.

## File path

Write all files directly into the **Doc Directory** (see `references/PROJECT_OVERVIEW.md`, default is `/docs`) — no sub-folders:

```
<Doc Directory>/yyyy-mm-dd-<summary>-prd.md
```

- `yyyy-mm-dd` = date the PRD is written (e.g. `2026-08-07`)
- `<summary>` = the feature name in kebab-case (max 6 words, lowercase, no special characters)

**Example:** `/docs/2026-08-07-self-serve-assessment-creation-prd.md`

## PRD template

```markdown
# <Feature Name>

## Epic

- **Epic PRD:** <link or path to the parent epic document, or the ticket ID/URL>
- **Epic Architecture:** <link or path if one exists, otherwise `N/A`>

## Goal

**Problem:** <3–5 sentences about the user problem or business need this feature solves>

**Solution:** <how this feature solves that problem>

**Impact:** <expected results or metrics that should get better — e.g. user engagement, conversion rate, time-to-complete>

## User Personas

<the target user(s) for this feature, and what each one is trying to do>

## User Stories

- As a `<user persona>`, I want to `<perform an action>` so that I can `<achieve a benefit>`.
- ...

<cover the main paths and the edge cases>

## Requirements

### Functional Requirements

- <what the system must do — specific, clear behaviour that you can see>
- ...

### Non-Functional Requirements

- <limits and quality needs: performance, security, accessibility, data privacy>
- ...

## Acceptance Criteria

### <User story or requirement it covers>

- [ ] Given <context>, when <action>, then <visible result>
- [ ] ...

### <Next user story or requirement>

- [ ] ...

## Out of Scope

- <what is clearly not included in this feature>
- ...
```

## Overview file

After you write the PRDs, write **one** overview file that links to all of them:

```
<Doc Directory>/yyyy-mm-dd-<epic-summary>-prd-overview.md
```

- `<epic-summary>` = the **epic** name in kebab-case (max 6 words)
- Same date as the PRDs, same Doc Directory — so links are simple paths in the same folder (`./<file>.md`)

**Example:** `/docs/2026-08-07-performance-review-cycle-prd-overview.md`

### Overview template

```markdown
# <Epic Name> — PRD Overview

- **Epic:** <ticket ID / URL, or `N/A`>
- **Created:** yyyy-mm-dd
- **Features:** <n> · **Done:** <n> · **In progress:** <n> · **Not started:** <n>

## Summary

<2–4 sentences: what this epic delivers and for whom>

## Feature PRDs

| #   | Feature                        | PRD                                                       | Personas            | Depends On | Ticket | Status         |
| --- | ------------------------------ | --------------------------------------------------------- | ------------------- | ---------- | ------ | -------------- |
| 1   | Self-serve assessment creation | [PRD](./2026-08-07-self-serve-assessment-creation-prd.md) | Team Manager        | —          | —      | ⬜ Not started |
| 2   | Assessment results dashboard   | [PRD](./2026-08-07-assessment-results-dashboard-prd.md)   | Team Manager, Admin | #1         | —      | ⬜ Not started |

**Status legend:** ⬜ Not started · 🚧 In progress · ✅ Done

## Delivery Order

<the order in which to build the features, based on the Depends On column — point out anything that can be done in parallel>

1. #1 Self-serve assessment creation
2. #2 Assessment results dashboard _(blocked by #1)_

## Deferred to a later epic

- <features raised in Phase 2 but clearly not part of this epic>

## Open Questions

- [ ] <unclear point from Phase 1 or 2 that is still open, and who needs to answer it>
```

### Overview rules

- **Rows match Phase 2 exactly** — same numbers, same feature names, same dependencies. If a feature was split or merged after Phase 2, change the numbers both here and in the PRDs
- **Every feature has a row** — a PRD with no link cannot be tracked
- **Ticket column starts as `—`**. Phase 4 fills it in after the tickets are created
- **Status starts as ⬜ Not started** for every feature. After that, people update it by hand
- **Always keep Open Questions** — if there are none, write `- None`

## Rules

- **One file per feature** — do not merge several features into a single PRD
- **One overview file per epic** — write it again whenever features are added, split, or removed
- **No coding details** — no schemas, endpoints, libraries, file names, or architecture. If a requirement can only be written in technical terms, rewrite it as behaviour you can see
- **Every user story gets acceptance criteria** — a story with no AC is not finished
- **Out of Scope is never empty** — if nothing is left out, say so clearly and note where this feature ends and nearby features begin
- When there is a dependency, link to the other feature by its PRD path

## After writing

Show a summary of what you wrote:

```markdown
## 📄 PRDs Generated

| #   | Feature                        | Path                                                   |
| --- | ------------------------------ | ------------------------------------------------------ |
| 1   | Self-serve assessment creation | /docs/2026-08-07-self-serve-assessment-creation-prd.md |
| 2   | Assessment results dashboard   | /docs/2026-08-07-assessment-results-dashboard-prd.md   |

**Overview:** /docs/2026-08-07-performance-review-cycle-prd-overview.md
```

Then ask: _"PRDs saved ✅ — track them from the overview file. Should I go on and create the feature tickets in your ticket system?"_
