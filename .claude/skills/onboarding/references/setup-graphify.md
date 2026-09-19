# Graphify Setup

Graphify turns a repository — code, SQL schemas, docs, PDFs, images — into a knowledge graph that AI agents can search, so they do not miss code context. See [graphify on GitHub](https://github.com/safishamsi/graphify).

## Prerequisites

- Python 3.10+
- `uv` (recommended) or `pipx`

## Install

The PyPI package is `graphifyy` (double-y); the CLI command is `graphify`.

```bash
# Recommended
uv tool install graphifyy

# Alternatives
pipx install graphifyy
pip install graphifyy
```

Optional extractors (install only what the project needs):

```bash
uv tool install "graphifyy[sql]"     # SQL schema extraction
uv tool install "graphifyy[pdf]"     # PDF extraction
uv tool install "graphifyy[office]"  # .docx / .xlsx
uv tool install "graphifyy[all]"     # everything
```

## Register with Claude Code

Add Graphify as a skill for the current project only:

```bash
graphify install --project
```

Run this once. After that, the assistant can use the graph on its own.

`graphify install --project` writes its usage notes into a root `CLAUDE.md`. To follow the project rule, move that Graphify block from the root `CLAUDE.md` into `.claude/CLAUDE.md` (create the file if it does not exist). Then delete the root `CLAUDE.md`, which is now empty. All AI instructions live in `.claude/CLAUDE.md`.

## Build the graph

```bash
graphify .                 # build graph for the current folder
graphify . --update        # re-extract only changed files
graphify . --no-viz        # skip HTML, output report + JSON only
```

This creates `graphify-out/` (`graph.html`, `GRAPH_REPORT.md`, `graph.json`). Commit `graphify-out/` so the whole team uses the same map.

Reading docs/PDFs/images without a UI needs an LLM API key — set `ANTHROPIC_API_KEY` (Claude) in the environment before you build. Code files are read locally and never sent to an API.

## Query the graph

```bash
graphify query "what connects auth to the database?"
graphify path "UserService" "DatabasePool"
graphify explain "RateLimiter"
```

## Keep it up to date (optional)

```bash
graphify hook install      # auto-rebuild on commit
```
