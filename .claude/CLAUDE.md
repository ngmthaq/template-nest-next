# CLAUDE

Always read all the markdown files linked in the sections below. They give you the full picture of the project and the things to do (DO) and not do (DO NOT).

---

## PROJECT OVERVIEW

This section gives a short overview of the project: name, description, programming languages, frameworks, main libraries, package manager, and where the docs live - see [PROJECT_OVERVIEW](./references/PROJECT_OVERVIEW.md).

---

## CODING CONVENTIONS

This section describes the coding rules for the project. When agents write code, they must follow these rules so the code stays the same style everywhere - see [CODING_CONVENTIONS](./references/CODING_CONVENTIONS.md)

---

## AGENT RULES

This section lists the "DO" and "DO NOT" rules. Agents use them to decide what to do first when they get a task, and what they must never do - see [AGENT_RULES](./references/AGENT_RULES.md)

---

## WRITING STYLE

This section describes how agents must write text — plain, simple English that non-native speakers can read easily. Every skill and sub-agent must follow it - see [WRITING_STYLE](./references/WRITING_STYLE.md)

---

## GRAPHIFY

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
