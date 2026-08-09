# Secret Patterns

The authoritative pattern list is encoded in
[`../scripts/scan-secrets.sh`](../scripts/scan-secrets.sh) — run it first. This document
covers what the script detects, what it cannot detect, and how to remediate a leak.

> **Never print a discovered secret value in full.** Report type, location, severity, and a
> masked prefix (`sk_live_abc1…`) only.

---

## Running the Scanner

```bash
chmod +x .claude/skills/security-scanner/scripts/scan-secrets.sh

# Diff mode — inspects only added (+) lines; ignores removals and context
git diff --cached | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff
git diff         | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff
git show         | .claude/skills/security-scanner/scripts/scan-secrets.sh --diff

# File mode — full audit of specific files
.claude/skills/security-scanner/scripts/scan-secrets.sh .env config/settings.py
```

Prefer diff mode during reviews: it keeps CI fast and reports exactly what is being
introduced. Exit `0` = clean, exit `1` = findings — block the merge.

---

## Detected Patterns

| Type                      | Severity | Signature                                                    |
| ------------------------- | -------- | ------------------------------------------------------------ |
| AWS access key            | CRITICAL | `AKIA` + 16 uppercase alphanumerics                          |
| AWS secret key            | CRITICAL | `aws_secret_access_key = <40 base64 chars>`                  |
| GCP service account       | CRITICAL | `"type": "service_account"` in JSON                          |
| GCP API key               | HIGH     | `AIza` + 35 chars                                            |
| Azure client secret       | CRITICAL | `azure_client_secret = <34+ chars>`                          |
| GitHub tokens             | CRITICAL | `ghp_` / `gho_` / `ghs_` / `ghr_` + 36, `github_pat_` + 82   |
| Private keys              | CRITICAL | `-----BEGIN (RSA\|EC\|OPENSSH\|DSA\|PGP) PRIVATE KEY-----`   |
| Stripe secret             | CRITICAL | `sk_live_` + 24+; restricted `rk_live_` = HIGH               |
| Slack token / webhook     | HIGH     | `xox[baprs]-…` / `hooks.slack.com/services/…`                |
| Discord bot token         | HIGH     | `[MN]<23+>.<6>.<27+>`                                        |
| Twilio API key            | HIGH     | `SK` + 32 hex                                                |
| SendGrid API key          | HIGH     | `SG.<22>.<43>`                                               |
| npm token                 | HIGH     | `npm_` + 36                                                  |
| Generic secret assignment | HIGH     | `(secret\|token\|password\|api_key\|client_secret) = "<8+>"` |
| DB connection string      | HIGH     | `mongodb\|postgres\|mysql\|redis\|amqp\|mssql://…`           |
| Bearer / JWT              | MEDIUM   | `Bearer <jwt>` / `eyJ….eyJ….<sig>`                           |
| Internal IP + port        | MEDIUM   | RFC1918 address with an explicit port                        |

---

## What the Script Cannot Catch — Review Manually

**High-entropy strings with no recognisable prefix.** Flag any literal ≥ 20 characters that
mixes upper, lower, and digits, is assigned to a security-sounding name, and is not a hash
of test data or a base64 fixture. Shannon entropy above 4.0 bits/char on a base64 alphabet
(or above 3.0 on hex) is a strong signal.

**Location-based risks:**

- `.env`, `.env.local`, `.env.production` committed to the repo — check `git ls-files`, not
  just the working tree, and confirm `.gitignore` coverage.
- **CI/CD** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`: literals in `env:`
  blocks, secrets echoed into logs, `pull_request_target` combined with checkout of
  untrusted refs, unpinned third-party actions (`uses: foo/bar@main`).
- **Docker** — `ENV`/`ARG` holding credentials (baked into image layers forever), `.dockerignore`
  missing `.env`, secrets in `RUN` commands.
- **IaC** — Terraform `.tfvars` and state files, Kubernetes `Secret` manifests with plain
  base64 (base64 is encoding, not encryption), Helm `values.yaml`, Ansible vars.
- **Client bundles** — keys in `NEXT_PUBLIC_*`, `REACT_APP_*`, `VITE_*`, mobile app source,
  or anything shipped to the browser.
- **Comments, docstrings, debug logs, test fixtures, README examples** — real credentials
  are routinely pasted into all five.
- **Git history** — a secret removed in a later commit is still live. Check
  `git log -p -S '<masked-prefix>'` when a rotation question arises.

**False positives to discard:** documented placeholder values (`sk_test_…`, `AKIAIOSFODNN7EXAMPLE`,
`xxx`, `changeme`, `<your-key-here>`), example keys in vendor docs, and test fixtures that
are clearly synthetic. Downgrade — do not silently drop — anything ambiguous.

---

## Remediation

Any confirmed secret in source is at minimum HIGH; a live production credential is CRITICAL.

1. **Rotate first.** The credential is compromised the moment it is committed — removing the
   line does not un-leak it. Rotation precedes cleanup.
2. **Replace with a reference** — an environment variable, or a secrets manager (AWS Secrets
   Manager, GCP Secret Manager, HashiCorp Vault, GitHub Actions secrets, Doppler).
3. **Purge history** if the repo is or was public — `git filter-repo` or BFG, then force-push
   and notify collaborators.
4. **Add a guard** — pre-commit hook running `scan-secrets.sh --diff`, plus provider-side
   push protection.
5. **Check for use** — audit provider logs for access with the leaked credential.
