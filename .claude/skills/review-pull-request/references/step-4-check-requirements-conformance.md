# Step 4 — Check That the Code Matches the Requirements

Use the PR title, description (body), and linked issues from Step 2. Compare them with the diff to answer:

| Question                                                              | How to check                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Does every requirement in the description have matching code changes? | Link each goal / acceptance criterion to at least one changed file or function. |
| Are there code changes that the description does not explain?         | Flag these changes — they may be unrelated or risky.                            |
| Does the PR description match what the code really does?              | Note any difference between what the PR says and what the code does.            |
| Are linked issues / tickets handled?                                  | If issues are linked, check that the related behavior is built.                 |

For each gap or difference you find, write down:

- **Requirement** (quoted from the description or issue)
- **Status**: `Missing` / `Partial` / `Mismatch` / `Unexplained change`
- **Details** (which files or logic are involved)
