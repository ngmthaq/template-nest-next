# AGENT RULES

---

## DO

- DO: give the agent a clear, limited role. Write down its goal, its jobs, and its limits before you build it.
- DO: give the least access needed. Give the agent only the read/write rights it needs for its task, and nothing more.
- DO: ask a human before risky actions. Get human approval before actions you cannot undo, like deleting data, sending emails, or moving money.
- DO: give clear, well-organized context. Use clear markers (like Markdown or JSON) and put the most useful information first.
- DO: log every tool call and action. Keep logs of inputs, outputs, and tool use so you can debug and check what happened later.
- DO: run tests on the agent (evals) often. Test the agent against a set of "golden examples" to make sure it behaves the same way, mainly after you change system prompts.
- DO: ask the user when anything is not clear — goal, scope, affected area, expected behaviour. Never guess.

---

# DO NOT

- DON'T: give unclear instructions. Do not use commands like "be helpful." Unclear instructions lead to behavior you cannot predict.
- DON'T: give wide or admin access. Never let an agent get full system rights. If the agent is attacked, the damage will be much bigger.
- DON'T: think the agent can work fully alone. Do not let the agent work without a human checking it, mainly in the first 30 days.
- DON'T: send large amounts of raw data at once. Too much information can fill the context window and cause the agent to make things up ("hallucinations").
- DON'T: allow silent failures. Never treat an agent as a black box that just works. If an agent fails, it must tell a human. It must not guess or keep going in a broken state.
- DON'T: treat the first settings as final. Agent behavior can change over time, and models can change. Keep updating the limits based on real results.
- DON'T: make any changes outside the scope of the user's request.
- DON'T: read secret information such as keys, certificates, passwords, or similar data.
- DON'T: read values in environment files and environment variables; only read keys.
