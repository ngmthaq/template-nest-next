# Step 4 — Triage and Group Comments

Turn the raw comments from Step 3 into a clean list of **tasks**. This list is the requirement you give to party-mode in Step 5.

## Remove comments that need no work

Skip a comment (and write down the reason for the Step 7 report) when it is:

- **Already resolved** or **outdated** (attached to a line that no longer exists).
- **Only praise or a thank-you** ("nice", "LGTM", "thanks").
- **A question that asks for no change** — write a reply for Step 6 instead of a code change.
- **Out of scope** for this PR (e.g. "we should refactor the whole module someday").
- **Unclear** — you cannot link it to a real change. Note it for the user instead of guessing.

Never make up what the reviewer wants. If a comment is unclear but clearly asks for a change, pass it on as an **open question** for party-mode's brainstorming step. Do not guess the fix.

## Classify each comment that needs work

Mark each one as `bug` (something wrong or broken the reviewer found) or `feature` (an asked-for improvement, refactor, naming, or behaviour change). Party-mode uses this to classify the intent.

## Group related comments

Put comments about the same file, function, or topic into one task, so one delegation can fix them together. Keep the original comment IDs with each task — Step 6 needs them to reply and resolve.

## Write the triage table

```markdown
| #   | File        | Line | Author    | Request (summary)                        | Class   | Action      | Comment IDs |
| --- | ----------- | ---- | --------- | ---------------------------------------- | ------- | ----------- | ----------- |
| 1   | `user.ts`   | 42   | @reviewer | Extract validation into its own function | feature | resolve     | 1234        |
| 2   | `user.ts`   | 88   | @reviewer | Use parameterized query (SQL injection)  | bug     | resolve     | 1235        |
| 3   | `README.md` | 10   | @reviewer | "nice catch"                             | —       | skip-praise | 1236        |
| 4   | `api.ts`    | 5    | @reviewer | "could we cache this?" (question)        | —       | reply-only  | 1237        |
```

Show this table to the user before you go on, so they can confirm it. The `resolve` rows are the work. `reply-only` rows get a reply in Step 6. `skip-*` rows are listed in the Step 7 report.
