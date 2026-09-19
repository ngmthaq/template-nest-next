# Phase 1 — Fetch & Analyze the Epic

## 1a. Find the input source

| Source                           | Action                       |
| -------------------------------- | ---------------------------- |
| User pasted text                 | Use it directly              |
| Jira ticket ID (e.g. `PROJ-123`) | Fetch via Atlassian Rovo MCP |
| Linear ticket ID/URL             | Fetch via Linear MCP         |
| GitHub Issue URL or `#number`    | Fetch via GitHub MCP         |

If the user gives a ticket ID but does not say which system, ask: _"Is that a Jira, Linear, or GitHub issue?"_

If the input is one feature and not an epic, say so and check with the user: _"This looks like one feature, not an epic. Should I write one PRD for it instead of splitting it into many features?"_

## 1b. Ask clarifying questions first

Before you analyze, check if the input answers all of these. If not, **ask the user** — do not make up answers:

- Who are the target users / personas?
- What problem or business need does this epic solve?
- What outcome or metric should improve?
- Are there known constraints (compliance, platform, launch date, existing product areas)?
- Is anything explicitly out of scope?

## 1c. Analyze and write a structured summary

Show this before you ask for Phase 2 approval:

```md
## 📋 Epic Analysis

**Title:** <epic title>
**Source:** Jira / Linear / GitHub / Pasted text
**Type:** Epic / User Story / Feature request

### Problem

<3–5 sentences: the user problem or business need this epic solves>

### Desired Outcome

<what success looks like, and the metrics expected to improve>

### Target Users / Personas

<who this is for, and what each persona is trying to accomplish>

### Product Scope

<bullet list of the abilities in scope, written as value for users — not technical layers>

### Out of Scope / Assumptions

<bullet list of assumptions or things clearly left out>

### Constraints

<non-functional constraints known so far: performance, security, accessibility, data privacy, compliance, platform>

### Risks / Open Questions

<anything unclear that the team needs to clear up>
```

Then ask: _"Does this analysis look right? Any corrections before I break the epic into features?"_
