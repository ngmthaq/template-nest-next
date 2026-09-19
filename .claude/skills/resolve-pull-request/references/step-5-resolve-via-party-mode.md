# Step 5 — Resolve via Party-Mode

The real fixes are made through the **party-mode** workflow. The Root Agent never edits files itself — every change goes to developer/tester sub-agents, and the Root Agent reviews it.

## Check out the PR branch first

Before any fix is made, make sure you work on the PR's head branch (from Step 2):

```bash
gh pr checkout <number>     # GitHub
# or: git fetch origin <head-branch> && git switch <head-branch>
```

Check that the working tree is clean before you delegate.

## Hand the triage list to party-mode

Load the [party-mode](../../party-mode/SKILL.md) skill and run its workflow. Use the **`resolve` rows from the Step 4 triage table** as the requirement. This is how the steps match party-mode's steps:

1. **Brainstorming** — Show each reviewer request as the requirement. Clear up each open question with the user (or by reading the reviewer's comment again). Classify each as `feature` or `bug` using the Step 4 tags.
2. **Planning** — The Root Agent writes a plan whose **Task List** has one entry per reviewer request (or per group), each marked with a `Responsible Role` (developer or tester) and the original **comment IDs**.
3. **Approval gate** — Show the plan and **wait for clear user approval**. No fix is made before approval. This gate is required.
4. **Delegation** — Start developer/tester sub-agents to make the changes. Run independent tasks in parallel.
5. **Result return + Review** — The Root Agent checks every sub-agent result against the reviewer's original comment, project conventions, and the plan. Delegate again any task that does not fully fix its comment.
6. **Summary** — party-mode reports the result of each task back here.

## Pass-through rules

- Every party-mode task must link to one or more **comment IDs** so Step 6 can reply to the right threads.
- A reviewer request is only "done" when the Root Agent's review accepts the change **and** the change really does what the comment asked — not just that some code changed.
- If a task is still `incomplete` or `blocked` after party-mode's loop guard stops it, report it. Do not mark its thread resolved in Step 6.
