# Step 2 — Identify the Target PR

Find the PR to review. Use this order:

1. **Argument provided** (PR number or URL) → fetch that PR.
2. **PR open in the editor** (MCP only) → use the MCP tool that returns the PR that is open right now in the editor.
3. **No PR found** → ask the user: _"Which PR should I review? Please provide a PR number or URL."_

## Using MCP

Use the MCP tool that fetches a PR by number/URL, or returns the PR open in the editor.

## Using the CLI

| Platform  | Find PR by number/URL                     | Current branch's PR     |
| --------- | ----------------------------------------- | ----------------------- |
| GitHub    | `gh pr view <number-or-url> --json ...`   | `gh pr view --json ...` |
| GitLab    | `glab mr view <number-or-url>`            | `glab mr view`          |
| Bitbucket | `bb pr view <number>` (flags vary by CLI) | per-CLI                 |

Collect from the PR:

- Title and description (body)
- Author, base branch, head branch
- Labels and linked issues (if any)

> Tip (GitHub): `gh pr view <n> --json number,title,body,author,baseRefName,headRefName,labels` returns these fields in one call.
