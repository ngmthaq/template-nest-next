# Step 4 — Collect Context

Collect all the context you can to fill the template. Use whatever the user gives you:

| Source                | How to collect                                                                     |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Git changes**       | `git diff <target-branch>...HEAD`; also `git log <target-branch>...HEAD --oneline` |
| **User input**        | The input given when starting this skill (ticket URL, requirement text, plan link) |
| **Plan / design doc** | Read any linked `.md` planning files in the workspace                              |
| **Ticket**            | If a URL is provided, fetch the ticket content                                     |
