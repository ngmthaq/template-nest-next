# Step 7 — Summary Report to User

After the Root Agent's review returns `accepted`, the Root Agent reports back to the user **as a chat message** using the template below. Pull every fact from the sub-agent results (Step 5) and the review (Step 6) — do not invent anything.

---

## Summary Report Template

```md
# Title: Summary — {short title matching the original request}

- Classification: feature | bug
- Description: {one sentence stating what was delivered}

---

## Goal

- {Restate the goal that was achieved — what the user asked for. For a bug, the root cause that was fixed, not just the symptom.}

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

- {Any outstanding items, risks, or suggested next steps — or "none".}
```

---

## Usage Notes

- Every row is sourced from the sub-agent results and the review — the report is a synthesis, not new work. If a fact is not on record, say so rather than guessing.
- **Tests** and **Verification** must reflect what actually ran. Do not claim a check passed that no `Verification / Checks Run` table recorded.
- List every non-blocking `medium`/`low` issue the review accepted at discretion under **Recommendations** so the user can decide on follow-up.
- After reporting, update the `Status` column in the `## Task List` section of the markdown plan document to reflect the final state of each task (`DONE`, `SKIPPED`, etc.).
