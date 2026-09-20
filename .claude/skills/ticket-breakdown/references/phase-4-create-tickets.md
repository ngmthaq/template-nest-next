# Phase 4 — Create Feature Tickets

Create **one ticket per feature** — not one per coding task. The engineering team splits each feature ticket into technical work themselves, based on the PRD.

## 4a. Choose where to create the tickets

Ask the user (unless they already said):

> "Where should I create these feature tickets?"
>
> - Jira (as child issues under the epic)
> - Linear (as sub-issues under the parent)
> - GitHub Issues (in a repo)

When the user picks a ticket system, confirm the target: project key / team / repo.

## 4b. Create tickets

**For each feature**, create a ticket with the matching MCP and this content:

- **Title:** feature name from Phase 2
- **Description:**
  - Goal — problem, solution, impact (from the PRD)
  - User stories
  - Acceptance criteria, as a checklist
  - Out of scope
  - Link/path to the full PRD file
- **Labels/Tags:** `feature` (or `enabler`), plus the product area if known — do **not** add layer tags like `frontend`, `api`, or `db`
- **Linked to parent:** link the ticket to the original epic
- **Dependencies:** add "blocked by" links for the product dependencies from the Phase 2 table (create them in dependency order so the IDs already exist)

Create tickets **in dependency order** so that "blocked by" links point to real tickets.

## 4c. Update the PRD overview

Edit the overview file from Phase 3 (`<Doc Directory>/yyyy-mm-dd-<epic-summary>-prd-overview.md`). Fill in the **Ticket** column in every row with the new ticket ID, linked to its URL — e.g. `[PROJ-124](<url>)`. Leave Status as ⬜ Not started; the team updates it.

## 4d. Show a summary

After all tickets are created, show a summary table:

```markdown
## ✅ Feature Tickets Created

| #   | Ticket ID | Feature                        | PRD                                                    | Link  |
| --- | --------- | ------------------------------ | ------------------------------------------------------ | ----- |
| 1   | PROJ-124  | Self-serve assessment creation | /.claude/plans/2026-08-07-self-serve-assessment-creation-prd.md | <url> |
| 2   | PROJ-125  | Assessment results dashboard   | /.claude/plans/2026-08-07-assessment-results-dashboard-prd.md   | <url> |

**Parent epic:** PROJ-123 — features linked ✅
**Overview updated:** /.claude/plans/2026-08-07-performance-review-cycle-prd-overview.md
```

## MCP Reference

| System | MCP to use         | Notes                                                                 |
| ------ | ------------------ | --------------------------------------------------------------------- |
| Jira   | Atlassian Rovo MCP | Use to fetch and create; link features to the epic with the Epic Link |
| Linear | Linear MCP         | Use sub-issues under the parent; set project if one exists            |
| GitHub | GitHub MCP         | Create issues with labels; use a milestone or project board if any    |

If an MCP is not connected, tell the user: _"I don't have [Jira/Linear/GitHub] connected. You can turn it on in the tools menu."_
