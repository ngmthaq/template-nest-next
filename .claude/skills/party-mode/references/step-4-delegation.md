# Step 4 — Delegation to Sub-Agents

The Root Agent reads the approved plan and starts the right sub-agent(s). **Developer** and **tester** are the only sub-agent roles here (each one gets its matching role file from [sub-agents](./sub-agents.md)).

> **ALWAYS** start a sub-agent; **DO NOT** change code yourself.
> Start both developer and tester sub-agents on the latest **Sonnet** model to use fewer tokens — not Opus or Fable.

## Start the developer sub-agent

Use this to hand out coding tasks from an approved plan. Pass the developer role file inline.

> Prompt template: [developer → Delegation Prompt Template](./developer.md#delegation-prompt-template)
> Role skill: [developer](./developer.md)

## Start the tester sub-agent

Use this to hand out test-writing tasks from an approved plan. Pass the tester role file inline.

> Prompt template: [tester → Delegation Prompt Template](./tester.md#delegation-prompt-template)
> Role skill: [tester](./tester.md)

## Running in parallel

When the developer and tester work does not overlap (or when the project's `Testing Workflow` is `Test-First`), the Root Agent **must** start both sub-agents in the **same tool turn** (many tool calls in one message) so they run at the same time. If not, start them one after the other: developer first, then tester.

## Re-delegation

When the Root Agent's review (Step 6) finds that the work is not good enough, start again the sub-agent named in each issue's `Responsible Role`. Paste the review feedback into the delegation's `Review Feedback` section.
