# CLAUDE

Always read all markdown files in the sections below to get complete information about the project, do-do (DO) and don't-do (DO NOT) tasks.

---

## PROJECT OVERVIEW

This section will provide an overview of the project, such as the project name, description, programming language, frameworks, main libraries used, library management platform, and project documentation location - see [PROJECT_OVERVIEW](./references/PROJECT_OVERVIEW.md).

---

## CODING CONVENTIONS

This section will describe the programming conventions for the project. If agents need to write code, they should follow these conventions to ensure everyone understands and adheres to them - see [CODING_CONVENTIONS](./references/CODING_CONVENTIONS.md)

---

## GIT CONVENTIONS

This section covers branch naming, base branch, merge strategy, commit message format, and PR
expectations - see [GIT_CONVENTIONS](./references/GIT_CONVENTIONS.md).

---

## AGENT RULES

This section provides information on "DO" and "DO NOT" clauses. Agents should refer to these items to prioritize tasks when receiving assignments from users or to avoid following them when receiving assignments from users - see [AGENT_RULES](./references/AGENT_RULES.md)

---

## GRAPHIFY

The repository is indexed into a knowledge graph at `graphify-out/` (god nodes, community
structure, cross-file relationships). The skill lives at
[graphify](./skills/graphify/SKILL.md) and is invoked with `/graphify`.

- For codebase questions, run `graphify query "<question>"` first whenever
  `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and
  `graphify explain "<concept>"` for a focused concept. These return a scoped subgraph, usually
  far smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of browsing source.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review, or when
  `query` / `path` / `explain` do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
