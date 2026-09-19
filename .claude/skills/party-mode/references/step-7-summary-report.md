# Step 7 — Summary Report to User

After the Root Agent's review is `accepted`, the Root Agent reports to the user **as a chat message** with the template below. Take every fact from the sub-agent results (Step 5) and the review (Step 6) — do not make anything up.

---

## Summary Report Template

```md
# Title: Summary — {short title matching the original request}

- Classification: feature | bug
- Description: {one sentence about what was delivered}

---

## Goal

- {Repeat the goal that was reached — what the user asked for. For a bug, the root cause that was fixed, not just the symptom.}

## What Changed

{2–4 sentences: what was delivered. For a bug, state the root cause that was fixed, not just the symptom.}

## Files Changed

| File           | Action                       | Notes                        |
| -------------- | ---------------------------- | ---------------------------- |
| {path/to/file} | created - modified - deleted | {brief note on what changed} |

## Tests

| Test        | Type                     | Result         |
| ----------- | ------------------------ | -------------- |
| {test name} | unit - integration - e2e | pass - skipped |

## Verification

- {Checks run and their outcomes: build, lint, tests, secret/security scan — copied from the sub-agent results' `Verification / Checks Run` tables.}

## Review Outcome

- Decision: accepted
- Recommendations (non-blocking `medium`/`low` issues left for follow-up): {list, or "none"}

## Follow-ups / Notes

- {Any open items, risks, or next steps — or "none".}
```

---

## Usage Notes

- Every row comes from the sub-agent results and the review — the report puts them together, it is not new work. If a fact is not written down, say so instead of guessing.
- **Tests** and **Verification** must show what really ran. Do not say a check passed if no `Verification / Checks Run` table lists it.
- List every non-blocking `medium`/`low` issue the review accepted under **Recommendations**, so the user can decide what to do next.
- After the report, update the `Status` column in the `## Task List` section of the markdown plan file to show the final state of each task (`DONE`, `SKIPPED`, etc.).
