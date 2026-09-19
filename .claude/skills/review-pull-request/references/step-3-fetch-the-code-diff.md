# Step 3 — Fetch the Code Diff

Get the full diff / file changes for the PR with the access method chosen in Step 1.

## Using MCP

Use the MCP tool to get the diff / file changes.

## Using the CLI

| Platform  | Diff command                              |
| --------- | ----------------------------------------- |
| GitHub    | `gh pr diff <number-or-url>`              |
| GitLab    | `glab mr diff <number-or-url>`            |
| Bitbucket | `bb pr diff <number>` (flags vary by CLI) |

**Large diffs (>400 changed lines):** Sum up by file/module instead of line by line.

From the diff, find:

- Which files are changed/added/deleted
- Whether any test files are present (e.g., `*.test.*`, `*.spec.*`, `*_test.*`, files under `tests/`, `__tests__/`, `spec/`)
- Language(s) and framework(s) used

> Save the diff hunks with their line numbers. Step 10 posts comments on exact files and lines, so you need the new line numbers for each finding.
