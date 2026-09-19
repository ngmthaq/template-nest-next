# Step 7 — Apply Security Scanner Review

Use the **[security-scanner](../../security-scanner/SKILL.md)** skill on the diff. Check the code yourself — do not run external SAST tools. But do run its `scripts/scan-secrets.sh --diff` on the diff.

For each finding, write down:

- **File and line range**
- **Severity**: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
- **Confidence**: `High` / `Medium` / `Low`
- **CWE / OWASP category**
- **Explanation**
- **Fix** (with code example)
