# Step 1 — Verify Access Method (MCP or CLI)

Decide how to read and post PR data, in this order:

## Tier 1 — Platform MCP (best)

Look through the available tools for an MCP that can:

- Fetch a PR/MR by number or URL
- Get the PR that is open right now in the editor
- Read PR diff or file changes
- Post **file + line** review comments

If you find such a tool → use **MCP** for the rest of the steps.

## Tier 2 — Platform CLI (backup)

If no matching MCP tool is found, find the platform from the remote and check for its CLI:

```bash
git remote get-url origin
```

| Remote pattern  | Platform  | CLI    | Availability check                                 | Auth check         |
| --------------- | --------- | ------ | -------------------------------------------------- | ------------------ |
| `github.com`    | GitHub    | `gh`   | `command -v gh`                                    | `gh auth status`   |
| `gitlab.*`      | GitLab    | `glab` | `command -v glab`                                  | `glab auth status` |
| `bitbucket.org` | Bitbucket | `bb`   | `command -v bb` (or other installed Bitbucket CLI) | per-CLI            |

If the platform CLI is installed and logged in → use the **CLI** for the rest of the steps.

If the CLI is installed but **not logged in**, tell the user how to log in (e.g. `gh auth login`, `glab auth login`) and stop until it is fixed.

## Neither available

If neither an MCP nor a platform CLI is available → reply to the user:

> "This skill needs either an MCP integration or a platform CLI (`gh`, `glab`, or a Bitbucket CLI) to fetch PR data. None was found. Please set one up and try again."

Then **end the session**.
