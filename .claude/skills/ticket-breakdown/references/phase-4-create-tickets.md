# Phase 4 — Create Feature Tickets

Create **one ticket per feature** — not per implementation task. The engineering team decomposes each feature ticket into technical work themselves, using the PRD as input.

## 4a. Determine output destination

Ask the user (unless already specified):

> "Where should I create these feature tickets?"
>
> - Jira (as child issues under the epic)
> - Linear (as sub-issues under the parent)
> - GitHub Issues (in a repo)

If the user picks a ticket system, confirm the target: project key / team / repo.

## 4b. Create tickets

**For each feature**, create a ticket using the appropriate MCP with this content:

- **Title:** feature name from Phase 2
- **Description:**
  - Goal — problem, solution, impact (from the PRD)
  - User stories
  - Acceptance criteria, formatted as a checklist
  - Out of scope
  - Link/path to the full PRD file
- **Labels/Tags:** `feature` (or `enabler`), plus the product area if known — do **not** apply layer tags like `frontend`, `api`, or `db`
- **Linked to parent:** link the ticket to the original epic
- **Dependencies:** add "blocked by" links for the product dependencies from the Phase 2 table (create in dependency order so IDs are known)

Create tickets **in dependency order** so that "blocked by" links resolve correctly.

## 4c. Output summary

After all tickets are created, output a summary table:

```markdown
## ✅ Feature Tickets Created

| #   | Ticket ID | Feature                        | PRD                                                    | Link  |
| --- | --------- | ------------------------------ | ------------------------------------------------------ | ----- |
| 1   | PROJ-124  | Self-serve assessment creation | /docs/2026-08-07-self-serve-assessment-creation-prd.md | <url> |
| 2   | PROJ-125  | Assessment results dashboard   | /docs/2026-08-07-assessment-results-dashboard-prd.md   | <url> |

**Parent epic:** PROJ-123 — features linked ✅
```

## MCP Reference

| System | MCP to use         | Notes                                                                  |
| ------ | ------------------ | ---------------------------------------------------------------------- |
| Jira   | Atlassian Rovo MCP | Use for fetch and create; link features to the epic via the Epic Link  |
| Linear | Linear MCP         | Use sub-issues under the parent; set project if one exists             |
| GitHub | GitHub MCP         | Create issues with labels; use milestone or project board if available |

If an MCP is not connected, tell the user: _"I don't have [Jira/Linear/GitHub] connected. You can enable it in the tools menu."_
