# Step 7 — Apply Security Scanner Review

Follow the **[security-scanner](../../security-scanner/SKILL.md)** skill against the diff (inline static audit — do not execute external SAST tools, but do run its `scripts/scan-secrets.sh --diff` on the diff).

For each finding, record:

- **File and line range**
- **Severity**: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
- **Confidence**: `High` / `Medium` / `Low`
- **CWE / OWASP category**
- **Explanation**
- **Remediation** (with code example)
