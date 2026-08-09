---
name: security-scanner
description: "Security Scanner — AI-powered security audit that reasons about code like a security researcher: traces data flows, understands component interactions, and catches vulnerabilities pattern-matching tools miss. Covers dependency CVEs (SCA), static analysis (SAST), injection flaws (SQLi, XSS, Command Injection, SSRF), broken auth and access control (IDOR/BOLA, JWT, CSRF, mass assignment), hardcoded secrets and credential exposure, weak cryptography, business logic bugs, and AI/LLM threats (prompt injection, tool abuse, data exfiltration). Use when: scanning or auditing a codebase, reviewing a diff or PR for security, checking for secrets or leaked credentials, hardening code, or any casual phrasing like 'is my code secure?', 'any vulnerabilities here?', 'check my repo', /security-scanner."
---

# Security Scanner

A structured, repeatable workflow for identifying, verifying, classifying, and remediating
security vulnerabilities across any codebase.

Unlike static analysers that only match patterns, this skill:

1. **Reads code like a security researcher** — understands context, intent, and data flow.
2. **Traces across files** — follows how untrusted input moves through the application.
3. **Self-verifies findings** — re-examines each result to filter false positives.
4. **Assigns severity** — CRITICAL / HIGH / MEDIUM / LOW / INFO.
5. **Proposes targeted patches** — every finding ships with a concrete fix.
6. **Requires human approval** — nothing is auto-applied; the user reviews first.

## When to Use

- Scanning a codebase, directory, or single file for vulnerabilities
- Reviewing a diff, commit, or pull request before merge
- Hunting hardcoded secrets, API keys, or credentials in code, config, CI/CD, or IaC
- Auditing dependencies for known CVEs
- Reviewing authentication, authorization, or access control logic
- Tracing user input from an entry point to a dangerous sink
- Auditing AI agent / LLM code for prompt injection and unsafe tool use
- Any request phrased as "is this safe?", "audit this", "check for vulnerabilities"

---

## Execution Workflow

Follow these steps **in order** every time.

### Step 1 — Scope Resolution & Discovery

Determine what to scan:

- If a path was given (`/security-scanner src/auth/`), scan only that scope.
- If a diff or PR is the subject, scan **only the changed lines** — not the whole repo.
- Otherwise scan the entire project from the root.

Then map the attack surface: languages and runtimes, dependency manifests (`package.json`,
`requirements.txt`, `go.mod`, `*.csproj`, `Gemfile`, `pom.xml`, `Cargo.toml`,
`composer.json`), lockfiles, framework signals, HTTP/CLI/queue entry points, and trust
boundaries — where does untrusted data enter?

Load [`references/language-patterns.md`](./references/language-patterns.md) for the
framework-specific patterns that apply to the detected stack.

**Output before proceeding:** a one-paragraph threat model. Example:

> "Node.js/Express API. Untrusted input enters via `req.body` and `req.query`. Three sinks:
> a PostgreSQL query builder, an `exec()` call in the export service, and an OpenAI prompt
> in the summarization endpoint. Auth is JWT with no role enforcement on admin routes."

### Step 2 — Dependency Audit (SCA)

Audit dependencies first — fast wins before reading source.

```bash
npm audit --json                      # Node.js
pip-audit --format=json               # Python
govulncheck ./...                     # Go
dotnet list package --vulnerable      # .NET
bundle-audit check --update           # Ruby
mvn dependency-check:check            # Java
cargo audit                           # Rust
```

Flag CVEs with CVSS ≥ 7.0, transitive vulnerabilities, deprecated crypto libraries, and
pinned versions with no upstream fix. Downgrade severity for `devDependencies` that never
reach production. When no tooling is available, check manifests against the watchlist in
[`references/vulnerable-packages.md`](./references/vulnerable-packages.md).

### Step 3 — Secrets & Exposure Scan

Run the bundled scanner — **actually execute it**, do not simulate the output:

```bash
chmod +x .claude/skills/security-scanner/scripts/scan-secrets.sh

# Diff mode (preferred for reviews) — inspects only added lines
git diff --cached | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff
git diff         | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff
git show         | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff

# File mode (full-codebase audit)
.claude/skills/security-scanner/scripts/scan-secrets.sh path/to/file.env path/to/config.py
```

| Exit code | Meaning                                     |
| --------- | ------------------------------------------- |
| `0`       | No secrets detected                         |
| `1`       | One or more secrets found — **block merge** |

The script covers cloud keys, GitHub tokens, private keys, connection strings, SaaS keys,
and JWTs. Supplement it with a manual review of config, `.env`, CI/CD workflows,
Dockerfiles, and IaC using [`references/secret-patterns.md`](./references/secret-patterns.md)
— including entropy heuristics and secrets in comments, debug logs, or committed history.

> **Never print a discovered secret value in full.** Report its type, location, and a
> masked prefix only.

### Step 4 — Static Analysis (SAST)

```bash
semgrep --config=auto --json .
```

Enable rule sets `p/owasp-top-ten`, `p/secrets`, `p/jwt`, `p/sql-injection`, `p/xss`, plus
the language pack (`p/nodejs`, `p/python`, `p/java`). Supplement with targeted grep for
what Semgrep misses:

```bash
grep -rn "password\s*=\s*['\"]"    --include="*.py" --include="*.js"
grep -rn "eval("                    --include="*.js"
grep -rn "os\.system\|shell=True"   --include="*.py"
grep -rn "dangerouslySetInnerHTML"  --include="*.jsx" --include="*.tsx"
```

If external tooling cannot be executed (offline, sandboxed, or PR-review context), apply
the same rules inline by reading the code — the deep scan in Step 5 is the fallback.

### Step 5 — Vulnerability Deep Scan

The core pass. Reason about the code; do not just pattern-match. Trace
`[source] → [processing] → [sink]` for every untrusted input.

Full detection signals, safe patterns, and escalation checks live in
[`references/vuln-categories.md`](./references/vuln-categories.md):

- **Injection** — SQLi (incl. second-order), XSS, command injection, LDAP/XPath/header/log injection, template injection
- **Auth & access control** — missing authn, IDOR/BOLA, JWT weaknesses (`alg:none`, weak secret, no expiry), session fixation, CSRF, privilege escalation, mass assignment
- **Data handling** — sensitive data in logs/errors/responses, missing encryption in transit or at rest, insecure deserialization, path traversal, XXE, SSRF
- **Cryptography** — MD5/SHA1/DES for security purposes, hardcoded IVs or salts, `Math.random()` for tokens, disabled TLS verification
- **Business logic** — race conditions (TOCTOU), integer overflow in financial math, missing rate limiting, predictable identifiers
- **API surface** — unvalidated input at entry points, secrets in query parameters, missing schema validation

### Step 6 — AI / LLM Security

Run whenever the codebase calls an LLM, implements an agent, or builds a RAG pipeline.
Details in [`references/ai-llm-security.md`](./references/ai-llm-security.md):

- **Prompt injection** — user input interpolated into system prompts instead of role-separated
- **Insecure tool use** — LLM output selecting/invoking tools without an allowlist and typed arg validation
- **Data leakage** — DB rows, PII, or file contents sent to a third-party provider unredacted
- **Indirect prompt injection** — instructions embedded in fetched pages or retrieved documents

**Rule:** LLM output is untrusted input. Validate it exactly as you would `req.body`.

### Step 7 — Cross-File Data Flow Analysis

After the per-file pass, review holistically:

- Trace user-controlled input from entry points (HTTP params, headers, body, uploads) all
  the way to sinks (DB queries, `exec` calls, HTML output, file writes, LLM prompts).
- Surface vulnerabilities visible only when several files are read together.
- Check trust boundaries between services, modules, and internal APIs.

### Step 8 — Self-Verification Pass

For **each** finding:

1. Re-read the relevant code with fresh eyes.
2. Ask: is this actually exploitable, or is there sanitization I missed?
3. Check whether a framework or middleware already handles it upstream.
4. Discard or downgrade anything that is not a genuine vulnerability.
5. Assign a final severity and a confidence rating (High / Medium / Low).

### Step 9 — Report

Emit the report in the exact structure defined in
[`references/report-format.md`](./references/report-format.md) — a severity summary table
first, then finding cards grouped by category.

### Step 10 — Propose Patches

For every CRITICAL and HIGH finding, produce a concrete patch: the vulnerable code
(before), the fixed code (after), what changed and why, and what to test to confirm the
fix. Preserve the original code style, variable names, and structure.

Safe to auto-fix on request: `npm audit fix`, patch-level dependency bumps. Verify first:
`npm audit fix --force` (breaking semver jumps). Manual only: anything logic-related —
broken auth, IDOR, SSRF allowlists, prompt injection.

State explicitly: **"Review each patch before applying. Nothing has been changed yet."**

---

## Severity Guide

| Severity                   | Criteria                                                              | Example                          | CI Gate                 |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------- | ----------------------- |
| 🔴 **CRITICAL**            | Remotely exploitable, no auth required; data breach likely            | Unauthed SQLi, RCE, auth bypass  | Block merge             |
| 🟠 **HIGH**                | Realistic attack path, significant impact                             | Stored XSS, IDOR, live secret    | Warn; requires approval |
| 🟡 **MEDIUM**              | Exploitable only with conditions or chaining                          | CSRF, open redirect, weak crypto | Report only             |
| 🔵 **LOW**                 | Best-practice gap, defense-in-depth                                   | Verbose errors, missing headers  | Report only             |
| ⚪ **INFO**                | Hygiene or observability observation                                  | Outdated dep with no CVE         | Report only             |
| ⚫ **NEEDS MANUAL REVIEW** | Sink is reachable but the input shape is unclear from static analysis | Dynamic dispatch into a query    | Escalate before merge   |

Downgrade when the path sits behind sound authentication. Upgrade when the finding is in a
payment flow, auth system, or PII handler.

---

## Enforcement Rules

- **Never** auto-apply a patch — present it for human review.
- **Never** print a full secret value; mask it.
- **Always** lead with the findings summary table (counts by severity).
- **Always** include file path, line number, and the exact vulnerable snippet.
- **Always** attach a confidence rating per finding, and group findings by category — not by file.
- **Explain the risk in plain English** — what does an attacker actually achieve?
- **Do not mark code as secure or a task as complete** while any CRITICAL or HIGH finding is
  unresolved, or while `scan-secrets.sh` exits `1`.
- If the scope is clean, say so plainly — "No vulnerabilities found" — and list what was scanned.

---

## Reference Files

| Reference                                                     | Load when                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [vuln-categories.md](./references/vuln-categories.md)         | Step 5 — detection signals, vulnerable vs. safe code, and escalation checks per category       |
| [secret-patterns.md](./references/secret-patterns.md)         | Step 3 — regex patterns, entropy heuristics, CI/CD and IaC secret risks, remediation for leaks |
| [language-patterns.md](./references/language-patterns.md)     | Step 1 — framework-specific sinks for JS/TS, Python, Java, PHP, Go, Ruby, Rust, .NET           |
| [vulnerable-packages.md](./references/vulnerable-packages.md) | Step 2 — curated CVE watchlist for npm, pip, Maven, RubyGems, Cargo, Go modules                |
| [ai-llm-security.md](./references/ai-llm-security.md)         | Step 6 — prompt injection, tool abuse, data exfiltration, agentic and RAG threats              |
| [report-format.md](./references/report-format.md)             | Step 9 — finding card template, summary block, patch proposal formatting                       |
