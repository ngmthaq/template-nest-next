# Secret Patterns

The main pattern list is in
[`../scripts/scan-secrets.sh`](../scripts/scan-secrets.sh) — run it first. This file
explains what the script finds, what it cannot find, and how to fix a leak.

> **Never print a secret value in full.** Report only its type, location, severity, and a
> masked prefix (`sk_live_abc1…`).

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

Use diff mode during reviews: it keeps CI fast and reports only what is new.
Exit `0` = clean, exit `1` = findings — block the merge.

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

## What the Script Cannot Find — Check by Hand

**Random-looking strings with no known prefix.** Flag any string of 20+ characters that
mixes upper case, lower case, and digits, has a security-like name (key, token, secret), and is not a hash
of test data or a base64 test value. Shannon entropy above 4.0 bits/char for base64
(or above 3.0 for hex) is a strong sign.

**Risky places:**

- `.env`, `.env.local`, `.env.production` committed to the repo — check `git ls-files`, not
  only the working tree, and check that `.gitignore` covers them.
- **CI/CD** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`: literals in `env:`
  blocks, secrets printed into logs, `pull_request_target` used together with checkout of
  untrusted refs, third-party actions not locked to a version (`uses: foo/bar@main`).
- **Docker** — `ENV`/`ARG` holding credentials (saved in image layers forever), `.dockerignore`
  without `.env`, secrets in `RUN` commands.
- **IaC** — Terraform `.tfvars` and state files, Kubernetes `Secret` manifests with plain
  base64 (base64 is encoding, not encryption), Helm `values.yaml`, Ansible vars.
- **Client bundles** — keys in `NEXT_PUBLIC_*`, `REACT_APP_*`, `VITE_*`, mobile app source,
  or anything sent to the browser.
- **Comments, docstrings, debug logs, test fixtures, README examples** — people often paste real
  credentials into all five.
- **Git history** — a secret deleted in a later commit is still leaked and still works. Check
  `git log -p -S '<masked-prefix>'` when you need to know if a key must be changed.

**False alarms to ignore:** known placeholder values (`sk_test_…`, `AKIAIOSFODNN7EXAMPLE`,
`xxx`, `changeme`, `<your-key-here>`), example keys in vendor docs, and test values that
are clearly fake. If you are not sure, lower the severity — do not quietly drop it.

---

## How to Fix

Any real secret in source code is at least HIGH. A working production credential is CRITICAL.

1. **Rotate (replace) the key first.** The credential is leaked the moment it is committed — deleting the
   line does not undo the leak. Rotate before you clean up.
2. **Use a reference instead** — an environment variable, or a secrets manager (AWS Secrets
   Manager, GCP Secret Manager, HashiCorp Vault, GitHub Actions secrets, Doppler).
3. **Clean the git history** if the repo is or was public — `git filter-repo` or BFG, then force-push
   and tell the other people on the repo.
4. **Add a guard** — a pre-commit hook that runs `scan-secrets.sh --diff`, plus push
   protection on the git provider.
5. **Check for use** — look in provider logs for any access with the leaked credential.
