# Step 5 — Load Sub-Skills

Load each sub-skill in full before you use it. Follow every rule and phase in the skill — do not skim or skip steps.

| Sub-skill                                           | Load condition                             |
| --------------------------------------------------- | ------------------------------------------ |
| [clean-code](../../clean-code/SKILL.md)             | Always                                     |
| [security-scanner](../../security-scanner/SKILL.md) | Always                                     |
| [aaa-testing](../../aaa-testing/SKILL.md)           | Only if test files are present in the diff |

> `security-scanner` runs on the diff only. Do its deep security scan and data-flow checks yourself — you do not need external SAST tools. But do run `scripts/scan-secrets.sh --diff` on the diff.
