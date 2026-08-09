# Phase 1 — Fetch & Analyze the Epic

## 1a. Determine input source

| Source                           | Action                       |
| -------------------------------- | ---------------------------- |
| User pasted text                 | Use it directly              |
| Jira ticket ID (e.g. `PROJ-123`) | Fetch via Atlassian Rovo MCP |
| Linear ticket ID/URL             | Fetch via Linear MCP         |
| GitHub Issue URL or `#number`    | Fetch via GitHub MCP         |

If the user provides a ticket ID but no system is specified, ask: _"Is that a Jira, Linear, or GitHub issue?"_

If the input is a single feature rather than an epic, say so and confirm with the user: _"This reads as one feature, not an epic. Shall I write a single PRD for it instead of breaking it into multiple features?"_

## 1b. Ask clarifying questions first

Before analyzing, check whether you can answer all of these from the input. If not, **ask the user** — do not invent answers:

- Who are the target users / personas?
- What problem or business need is this epic addressing?
- What outcome or metric should improve?
- Are there known constraints (compliance, platform, launch date, existing product areas)?
- Is anything explicitly out of scope?

## 1c. Analyze and output a structured summary

Present this before asking for Phase 2 approval:

```md
## 📋 Epic Analysis

**Title:** <epic title>
**Source:** Jira / Linear / GitHub / Pasted text
**Type:** Epic / User Story / Feature request

### Problem

<3–5 sentences: the user problem or business need this epic addresses>

### Desired Outcome

<what success looks like, and the metrics expected to improve>

### Target Users / Personas

<who this is for, and what each persona is trying to accomplish>

### Product Scope

<bullet list of the capabilities in scope, expressed as user-facing value — not technical layers>

### Out of Scope / Assumptions

<bullet list of assumptions or explicit exclusions>

### Constraints

<non-functional constraints known so far: performance, security, accessibility, data privacy, compliance, platform>

### Risks / Open Questions

<anything ambiguous that the team needs to clarify>
```

Then ask: _"Does this analysis look right? Any corrections before I break the epic into features?"_
