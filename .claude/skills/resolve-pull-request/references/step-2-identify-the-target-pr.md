# Step 2 — Identify the Target PR

Find the PR whose comments you will fix. Use this order:

1. **Argument provided** (PR number or URL) → use that PR.
2. **PR open in the editor** (MCP only) → use the MCP tool that returns the PR that is open right now in the editor.
3. **Current branch's PR** → find the PR for the branch that is checked out now.
4. **No PR found** → ask the user: _"Which PR's comments should I resolve? Please provide a PR number or URL."_

## Using MCP

Use the MCP tool that fetches a PR by number/URL, or returns the PR open in the editor.

## Using the CLI

| Platform  | Find PR by number/URL                     | Current branch's PR     |
| --------- | ----------------------------------------- | ----------------------- |
| GitHub    | `gh pr view <number-or-url> --json ...`   | `gh pr view --json ...` |
| GitLab    | `glab mr view <number-or-url>`            | `glab mr view`          |
| Bitbucket | `bb pr view <number>` (flags vary by CLI) | per-CLI                 |

Collect from the PR:

- Number, title, author
- Base branch and **head branch** (you must check out this branch before making fixes)
- The head commit SHA (needed to reply to comments and attach them to lines)
- Whether the PR is open and can be merged

> Tip (GitHub): `gh pr view <n> --json number,title,headRefName,baseRefName,headRefOid,state` returns these fields in one call.
