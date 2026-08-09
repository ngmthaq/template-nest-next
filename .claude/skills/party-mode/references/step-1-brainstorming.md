# Step 1 — Brainstorming (Root Agent)

When a user prompt arrives, the Root Agent **must greet the user, classify the intent, and brainstorm the requirement with the user** before anything else. Brainstorming is an interactive dialogue — the Root Agent clarifies intent, classifies the request, explores the relevant codebase context, and surfaces every open question **before** any plan is written.

> The Root Agent runs brainstorming itself. It may spawn one or more **read-only research sub-agents** to explore the codebase when the exploration is broad or spans many files — but these sub-agents research and report only; they never edit files, and no developer/tester (implementation) sub-agent is spawned at this stage.

---

## Check Task Complexity

**Before classifying the intent, assess the size of the request.** A task is **big** when it:

- spans multiple layers (DB / API / business logic / UI),
- describes an epic, user story, or feature request too large for a handful of atomic tasks, or
- has many independent moving parts.

**If the task is big, STOP.** Tell the user they must run the [ticket-breakdown](../../ticket-breakdown/SKILL.md) skill first to decompose it into feature-level tickets, each with its own PRD, then **end the session**. Do not classify, brainstorm further, plan, or spawn any sub-agent. The user re-invokes `/party-mode` on an individual feature ticket once the breakdown is done.

Only continue to classification when the task is small enough to be handled directly.

---

## Classify the Intent

Classification shapes the brainstorming questions and the eventual plan structure.

### Feature

Classify as `feature` when the prompt describes:

- New functionality to be added
- Agent skill additions or modifications that add new capabilities
- An existing behaviour to be refactored or improved
- A performance improvement with no broken behaviour involved
- A non-breaking change that adds value or enhances the user experience
- A change that is explicitly framed as a "feature" by the user

**Signal words:** "add", "implement", "create", "build", "refactor", "improve", "migrate", "support", "enable", "integrate"

### Bug

Classify as `bug` when the prompt describes:

- Something that was working and is now broken
- Unexpected or incorrect behaviour
- A crash, error, or exception
- A regression introduced by a recent change
- Output that does not match the specification
- A change that is explicitly framed as a "bug" by the user

**Signal words:** "broken", "not working", "fails", "error", "crash", "wrong", "incorrect", "regression", "unexpected", "should be", "used to work"

### Ambiguous Cases

**Rule: ALWAYS ask the user. Never assume.**

If the prompt contains signals for both `feature` and `bug`, or if intent cannot be determined with confidence, ask the user a direct, specific question before proceeding. Do not guess, infer, or proceed with a best-effort classification.

---

## Brainstorming Dialogue

1. **Greet the user and restate the request** in your own words so misunderstandings surface immediately. User prompts can be confusing or contain spelling errors — analyze and clarify them.
2. **Check task complexity** (see [Check Task Complexity](#check-task-complexity) above). If the task is big, instruct the user to run the [ticket-breakdown](../../ticket-breakdown/SKILL.md) skill first, then **end the session** — do not proceed to classification.
3. **Classify the intent** (`feature` or `bug`) using the rules above.
4. **Explore the codebase context.** Read the relevant files, modules, and conventions (read-only). Reference real paths — do not invent files. When the exploration is broad, spans many files, or needs parallel investigation, **spawn one or more read-only research sub-agents** to gather this context and report back — run independent research sub-agents in parallel by issuing multiple spawn calls in the same tool turn. Research sub-agents are strictly read-only: they search, read, and summarize findings; they never edit production or test files.
5. **Load relevant documents.** Scan the **Documents Folder** for previous plans or memory items related to this request.
6. **Scan the `skills/` directory** and note every skill relevant to the request domain — these will be assigned to sub-agents later.
7. **Gather classification-specific details:**
   - For a `feature`: scope, expected behaviour, affected areas, constraints, what is explicitly out of scope.
   - For a `bug`: observed behaviour (error messages, stack traces, logs), expected behaviour, and reproduction steps. Walk through the reproduction steps against the codebase to identify the suspected root cause.
8. **Surface every open question to the user.** List each unclear item as a direct, specific question — intent, scope, affected area, expected behaviour, constraints. **STOP and wait** for the user to answer every open question before moving to planning.
9. **Iterate.** If the user's answers raise new questions, ask again. Brainstorming ends only when the Root Agent can state the requirement with no remaining ambiguity.

---

## Usage Notes

- Brainstorming is always the **first action** of the Root Agent. No planning or implementation delegation happens before it — read-only research sub-agents are the only sub-agents allowed at this stage, and only to gather codebase context.
- **ALWAYS ask the user when anything is unclear** — there are no acceptable assumptions.
- The Root Agent also returns to this step when the user requests plan changes at the approval gate (Step 3).
- A request that cannot be clarified must be treated as blocked until the user answers — never proceed with placeholders.
