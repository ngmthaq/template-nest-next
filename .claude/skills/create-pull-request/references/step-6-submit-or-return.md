# Step 6 — Submit or Return

Create the PR/MR with the best method you have, in this order:

1. **Platform MCP** (best — most features)
2. **Platform CLI** (backup when there is no MCP)
3. **Manual copy-paste** (last resort)

## Tier 1 — Platform MCP (best)

Check if an MCP is available for the platform:

| Platform  | MCP tool to check                                                  |
| --------- | ------------------------------------------------------------------ |
| GitHub    | `github-pull-request_create_pull_request` or equivalent GitHub MCP |
| GitLab    | GitLab MCP (merge request creation tool)                           |
| Bitbucket | Bitbucket MCP (pull request creation tool)                         |

If MCP is available:

1. Show the user the filled template for review.
2. Ask: _"Should I create this pull request now using the [Platform] integration?"_
3. If the user says yes, call the MCP tool to create the PR/MR targeting `<target-branch>` with the filled description.
4. Send the PR/MR URL to the user.

## Tier 2 — Platform CLI (backup)

If no MCP is available, check if the platform's CLI (for the platform found in [Step 1](./step-1-detect-platform.md)) is installed and logged in:

| Remote pattern  | Platform  | CLI    | Availability check                                 | Auth check         |
| --------------- | --------- | ------ | -------------------------------------------------- | ------------------ |
| `github.com`    | GitHub    | `gh`   | `command -v gh`                                    | `gh auth status`   |
| `gitlab.*`      | GitLab    | `glab` | `command -v glab`                                  | `glab auth status` |
| `bitbucket.org` | Bitbucket | `bb`   | `command -v bb` (or other installed Bitbucket CLI) | per-CLI            |

If the CLI is installed and logged in:

1. Show the user the filled template for review.
2. Ask: _"Should I create this pull request now using `<cli>`?"_
3. If the user says yes, write the filled description to a temporary file (this avoids shell quoting problems with multi-line Markdown). Then run the create command for `<target-branch>`:

   **GitHub**

   ```bash
   gh pr create --base <target-branch> --title "<title>" --body-file <tmpfile>
   ```

   **GitLab**

   ```bash
   glab mr create --target-branch <target-branch> --title "<title>" --description "$(cat <tmpfile>)"
   ```

   **Bitbucket** — use the installed CLI's create command (flags are different for each tool). For the common `bb` CLI:

   ```bash
   bb pr create --target <target-branch> --title "<title>" --description "$(cat <tmpfile>)"
   ```

4. Delete the temporary file.
5. Send the PR/MR URL that the CLI prints to the user.

If the CLI is installed but **not logged in**, tell the user how to log in (e.g. `gh auth login`, `glab auth login`) and offer to use Tier 3 instead.

## Tier 3 — Manual copy-paste (last option)

If neither MCP nor a CLI is available:

- Return the fully filled PR description in a Markdown code block, so the user can copy and paste it into their platform.
