# Title: Plan — Interactive Docker infra + VM deploy scripts

- Classification: feature
- Description: Add two dependency-free bash TUI scripts under `scripts/` that reconcile the
  gitignored `.env.<env>` files against `.env.example`, then bring up the infra and app Compose
  stacks (locally or on a remote VM over SSH), with version-stamped image tags.

---

## Approach Summary / Goal

- A shared `scripts/lib/common.sh` holds every reusable primitive — ANSI headers, `read`/`read -rs`
  prompts, `select` menus, env-file reconciliation, version lookup, SSH prompt + preflight. Both
  scripts source it, so the two TUIs stay identical in behaviour and only their Compose action differs.
- Env reconciliation is the core mechanism: parse the ordered key list from `.env.example`, read the
  existing `.env.<env>` if present, display it for confirmation with secret values masked, then prompt
  **only** for keys the example has and the existing file lacks. A fresh VM has no file, so all keys
  are missing and the walk covers everything with example values as defaults.
- Version tagging piggybacks on Compose: `image:` gains an `APP_VERSION` prefix so the build produces
  `…:0.0.22-production`, then the script runs `docker tag` to move the `…:production` pointer. Rollback
  becomes a retag, with no rebuild.
- Goal: a fresh VM goes from bare Docker to a running stack by answering prompts, with no hand-edited
  env files and no guessing which build is live.

## Functional Requirements

- `scripts/01_run_docker_infra.sh` prompts for target (local | remote), environment, and — when remote
  — SSH host/user/port/identity/remote path, then runs `docker compose -f docker-compose-infra.yml up -d`.
- `scripts/02_deploy_docker_vm.sh` prompts for SSH details and environment, rsyncs the working tree to
  the VM, and runs `docker compose up -d --build` there.
- Both reconcile `apps/server/.env.<NODE_ENV>` against `apps/server/.env.example`; script 02 also
  reconciles `apps/client/.env.<NODE_ENV>` against `apps/client/.env.example`.
- The existing env file is displayed for confirmation before any prompting, with values masked for keys
  matching `*PASSWORD*|*SECRET*|*KEY*|*TOKEN*`. Declining offers re-prompting every key, or aborting.
- Values already present in the env file are never re-prompted and never altered.
- Keys present in the existing file but absent from `.env.example` are preserved, not dropped.
- Each write backs up the previous file to `.env.<env>.bak.<timestamp>` and writes atomically via
  tmpfile + `mv`, preserving `.env.example`'s comments and key order.
- Published host ports (`MYSQL_PORT`, `REDIS_PORT`, `PORT`, `CLIENT_PORT`) are exported into the Compose
  invocation, because Compose interpolates those from the shell — not from `env_file:`.
- Script 02 reads `version` from the root `package.json`, exports it as `APP_VERSION`, and after a
  successful build tags both images `:<version>-<env>` and `:<env>`.
- Script 02 ends with `docker compose logs --tail=50`. No health polling, no Prisma migrations.
- Both scripts print a final summary (target, environment, version, env files to be written/pushed) and
  require an explicit confirmation before any mutating command.

## Non-Functional Requirements

- `#!/bin/bash` + `set -euo pipefail`; no dependency beyond bash, rsync, ssh, docker. No `jq`, `gum`,
  `whiptail`, or `sshpass`.
- Passwords read with `read -rs`, never echoed, never passed as CLI arguments, never logged.
- Preflight checks with actionable errors: local `rsync`/`ssh`/`docker`, SSH reachability, remote
  `docker` + `docker compose` availability, `.env.example` presence.
- Comments capped at two lines per `.claude/references/CODING_CONVENTIONS.md` §5.
- Scripts are idempotent — re-running with the same answers changes nothing.
- Files committed with the executable bit set.

## Files in Scope

- `scripts/lib/common.sh` — created
- `scripts/01_run_docker_infra.sh` — created
- `scripts/02_deploy_docker_vm.sh` — created
- `docker-compose.yml` — modified (`APP_VERSION` in both `image:` tags)
- `apps/server/README.md` — modified (Docker section: the two scripts, version tags, rollback)
- `README.md` — modified (one-line pointer)
- `package.json` — modified (`infra` / `deploy` script entries)
- `docs/2026-09-17-11-34-06-interactive-docker-infra-and-deploy-scripts.md` — written at Step 3

## Risks & Assumptions

- **Env files ship from your laptop.** Per your choice, rsync does *not* exclude `.env.*`, so a local
  `apps/server/.env.production` overwrites the VM's. Mitigated by the pre-flight summary naming every
  file to be pushed, plus the timestamped backup taken on the VM side before overwrite — but the risk
  is real and inherent to this option.
- `docker-compose.yml` is modified for `APP_VERSION` only. Defaults are `${APP_VERSION:-0.0.0}`, so a
  plain `docker compose up` without the script still works, tagging `…:0.0.0-development`. This does
  change the image name produced by existing manual workflows — call it out in the README.
- Version is read from `package.json` with `sed`, not `jq`/`node`, since neither is guaranteed on a VM.
- Husky bumps the patch version on every commit, so most deploys produce a fresh immutable tag.
  Deploying twice from the same commit reuses the tag and overwrites that image.
- The VM builds the images, so it needs enough RAM for a pnpm + Next build. A small instance may OOM.
- Old `:<version>-<env>` images accumulate on the VM; no pruning is included.
- Bats/shunit2 are not in this repo, and adding a shell test framework is new infra. Tester validation
  is therefore static (`bash -n`, `shellcheck` when present) plus a documented manual smoke checklist.
  Say so at the gate if you want a real bats suite instead.
- Neither script tears anything down (`down`, `down -v`) — out of scope per the request.

## Open Questions / Blockers

- None. All items resolved during brainstorming.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                          | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                                  | Skills       |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | TODO   | Create `scripts/lib/common.sh` with TUI primitives, env reconciliation, version reader, SSH prompt/preflight helpers            | developer        | none         | Sourceable without side effects; every function single-purpose; masks secret keys; atomic write + backup; preserves example comments, key order, and unknown extra keys | `clean-code` |
| 2   | TODO   | Create `scripts/01_run_docker_infra.sh` — local/remote target, env select, env reconcile, `docker compose -f docker-compose-infra.yml up -d` | developer        | task 1       | Runs MySQL + Redis for the chosen env locally and over SSH; exports `MYSQL_PORT`/`REDIS_PORT`; confirmation gate before mutating; `bash -n` clean                     | `clean-code` |
| 3   | TODO   | Create `scripts/02_deploy_docker_vm.sh` — SSH prompts, reconcile both env files, rsync, remote `up -d --build`, retag, tail logs | developer        | task 1       | Full deploy to a VM; excludes `node_modules`/`.next`/`.git`/`dist`/`coverage`; both images carry `:<version>-<env>` and `:<env>`; ends with 50 log lines               | `clean-code` |
| 4   | TODO   | Modify `docker-compose.yml` to interpolate `APP_VERSION` into both `image:` tags                                               | developer        | none         | `APP_VERSION=1.2.3 NODE_ENV=production docker compose config` shows `…:1.2.3-production`; unset `APP_VERSION` falls back to `0.0.0`; no healthcheck blocks added        | `clean-code` |
| 5   | TODO   | Document the scripts in `apps/server/README.md` Docker section, add a `README.md` pointer and `package.json` script entries      | developer        | tasks 2,3,4  | Docker section covers both scripts, the env-reconcile flow, the new tag scheme, and how to roll back by retagging; two-line comment cap respected                     | `clean-code` |
| 6   | TODO   | Validate all three scripts: `bash -n` syntax, `shellcheck` when available, and write a manual smoke checklist into the plan doc  | tester           | tasks 1,2,3  | `bash -n` passes on all three; no `shellcheck` error-level findings; checklist covers fresh-VM, existing-env, and rollback paths                                       | `aaa-testing` |

---

# Revision 1 — Cross-platform support (approved 2026-09-17)

Requested mid-execution: the scripts must also run on Windows and Linux. Task 4 was already
complete and is unaffected.

## Findings that triggered the revision

- `scripts/lib/common.sh` used `mapfile` (bash 4+) at lines 228, 270, 315, 318 behind a
  `#!/bin/bash` shebang. macOS ships bash **3.2.57**, which has no `mapfile`, so the library was
  broken on macOS and worked on Linux only.
- Windows has no native bash. Git Bash ships **no `rsync`**, which script 02 depends on.
- No `.gitattributes` exists, so Git for Windows (`core.autocrlf=true` by default) would check out
  `*.sh` with CRLF, making the shebang fail as `bad interpreter`.

## Decisions

- **Windows target:** WSL **and** Git Bash/MSYS2 both supported.
- **Bash version:** require bash 4+ and fail fast, rather than targeting 3.2. Stock macOS therefore
  needs `brew install bash`.

## Non-Functional Requirements — added

- Runs unmodified on macOS (Homebrew bash), Linux, WSL, and Git Bash/MSYS2.
- Shebang is `#!/usr/bin/env bash`, so a modern bash in `PATH` wins over Apple's `/bin/bash` 3.2.
- Each entry point guards `(( BASH_VERSINFO[0] >= 4 ))` and dies with an actionable message before
  doing anything else. The guard itself must parse under bash 3.2 so it can print its own error.
- All `*.sh` files are LF-only, enforced by `.gitattributes`.

## Files in Scope — added

- `.gitattributes` — created (`*.sh text eol=lf`, plus `*.yml`/`*.yaml`)

## Risks & Assumptions — added

- Git Bash has no `rsync`; script 02 detects this and falls back to
  `tar -czf - . | ssh … tar -xzf -` — slower, no delta transfer, but needs nothing installed.
- MSYS rewrites POSIX-looking arguments, turning `/srv/template-nest-next` into
  `C:/Program Files/Git/srv/…` when passed to `ssh`. Remote paths are wrapped in `MSYS_NO_PATHCONV=1`.
- Stock macOS now requires `brew install bash` — surfaced as a clear error, not a cryptic failure.
- Docker Desktop supplies `docker` on Windows; `docker compose up -d` is non-interactive, so no
  `winpty` wrapper is needed.

## Task List — amended and added

| #   | Status | Task                                                                                                                                                                                   | Responsible Role | Dependencies   | Acceptance Criteria                                                                                                                              | Skills        |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1a  | TODO   | Amend `scripts/lib/common.sh`: remove the four `mapfile` calls, switch to `#!/usr/bin/env bash` guidance, add `bash_require_version`, `platform_is_msys`, and `transport_available` helpers | developer        | task 1         | Guard fires on bash 3.2 with an actionable message; no GNU-only util flags; `bash -n` clean under both bash 3.2 and 5.x                            | `clean-code`  |
| 7   | TODO   | Create `.gitattributes` forcing LF on `*.sh` (and `*.yml`/`*.yaml`)                                                                                                                      | developer        | none           | Fresh Windows clone with `core.autocrlf=true` yields LF-only `.sh`; `git check-attr text eol -- scripts/lib/common.sh` reports `eol: lf`           | `clean-code`  |
| 2   | TODO   | _(amended)_ Script 01 — add bash-4 guard and `#!/usr/bin/env bash`                                                                                                                       | developer        | tasks 1, 1a    | As originally specified, plus runs under WSL and Git Bash                                                                                         | `clean-code`  |
| 3   | TODO   | _(amended)_ Script 02 — add bash-4 guard, `rsync`→`tar\|ssh` fallback, `MSYS_NO_PATHCONV=1` on remote paths                                                                              | developer        | tasks 1, 1a    | As originally specified, plus a Git Bash run with no `rsync` completes the transfer via the tar fallback                                          | `clean-code`  |
| 5   | TODO   | _(amended)_ Docs — also state the bash 4+ requirement and the Windows/WSL guidance                                                                                                      | developer        | tasks 2,3,4,7  | README covers platform support and the `brew install bash` prerequisite                                                                           | `clean-code`  |
| 6   | TODO   | _(amended)_ Tester — add cross-platform checks                                                                                                                                         | tester           | tasks 1,1a,2,3 | `bash -n` passes under `/bin/bash` 3.2 **and** bash 5.x; grep proves no bash-4-only builtins outside guarded regions; no CRLF in any `.sh`        | `aaa-testing` |

---

# Revision 2 — Drop env reconciliation (approved 2026-09-17)

Requested mid-execution: the scripts were doing too much. Developers author their own env files;
the scripts should only verify a file exists and otherwise get on with deploying.

## Decisions

- **Env check:** existence only. Error with the path and a pointer to `.env.example` when absent.
  No key-diffing, no prompting for values, no masking, no backups.
- **Env location:** unchanged — still authored on the laptop and pushed by the transfer. Now a
  deliberate source-of-truth choice, since the developer writes the file rather than a prompt flow.
- **TUI:** retained for environment, SSH connection details, and published host ports. Only the
  env-value prompting layer is removed.

## Removed from `scripts/lib/common.sh` (~200 of 430 lines)

`env_reconcile`, `env_write`, `env_show`, `_env_prompt_for_key`, `_env_quote_if_needed`,
`_env_unquote`, `env_mask_value`, `env_is_secret_key`, and the `_ENV_RECONCILE_VALUES` global.

## Retained

Every `ui_*` helper, `env_keys`, `env_value` (script 01 reads `MYSQL_PORT` / `REDIS_PORT` from the
env file), `package_version`, `require_command`, all `ssh_*`, `platform_is_msys`,
`transport_available`.

## Added

- `env_require_file <path>` — dies with the path and a `.env.example` pointer when the file is absent.

## Review findings folded into this revision

| #   | Severity | File                             | Description                                                                                                                                                                                                                         |
| --- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | high     | `scripts/lib/common.sh`          | `ssh_opts` returns a single string that callers word-split unquoted, so an identity path containing a space (`C:\Users\First Last\.ssh\id_ed25519`, normal on Windows) reaches `ssh` as two broken arguments. Reproduced and confirmed. |
| B   | medium   | `scripts/02_deploy_docker_vm.sh` | `.env.<env>.bak.<timestamp>` files were not excluded from the transfer, so secret-bearing backups accumulated on the VM. **Resolved by Revision 2** — no backups are created any more.                                                |
| C   | low      | `scripts/02_deploy_docker_vm.sh` | No bash-version guard, unlike script 01. Covered indirectly by `set -e` on the failing `source`, but the error names the library rather than the script.                                                                              |
| D   | low      | `scripts/02_deploy_docker_vm.sh` | `reconcile_client_env` leaked its `mktemp` file on interrupt (no trap). **Resolved by Revision 2** — the function is deleted.                                                                                                        |
| E   | medium   | `scripts/01_run_docker_infra.sh` | Remote mode reconciled the _local_ env file, which never reached the VM, so answers silently had no effect remotely. **Resolved by Revision 2** — no reconciliation.                                                                  |

## Retained risk

The transfer still carries `.env.*`, so a laptop file overwrites the VM's copy. Script 02's summary
names both files explicitly before the confirmation gate.

## Task List — Revision 2

| #   | Status | Task                                                                                                                                                            | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                  | Skills        |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 8   | TODO   | Strip the env-prompting layer from `common.sh`; add `env_require_file`; fix `ssh_opts` to an array (finding A)                                                    | developer        | none         | `env_value` / `env_keys` / `ui_*` / `ssh_*` intact; an identity path containing a space reaches `ssh` as one argument; `bash -n` clean on 3.2 and 5.x | `clean-code`  |
| 9   | TODO   | Simplify `scripts/01_run_docker_infra.sh` — `env_reconcile` → `env_require_file`                                                                                 | developer        | task 8       | Missing env file exits with the path and a `.env.example` pointer; ports still read via `env_value`                                                   | `clean-code`  |
| 10  | TODO   | Simplify `scripts/02_deploy_docker_vm.sh` — both reconciles → `env_require_file`; delete the `mktemp`/`sed` client `API_URL` dance; add a bash guard (finding C) | developer        | task 8       | Both env files checked before any mutation; no temp files created; guard matches script 01                                                            | `clean-code`  |
| 5   | TODO   | _(amended)_ Docs — READMEs + `package.json` entries; restore the `See apps/server/README.md` pointer dropped from `docker-compose.yml`'s comment                  | developer        | tasks 9,10   | Documents the "author your own env file" prerequisite, bash 4.3+, Windows/WSL guidance, and rollback-by-retag                                         | `clean-code`  |
| 6   | TODO   | _(amended)_ Tester — static validation + manual smoke checklist                                                                                                 | tester           | tasks 8,9,10 | `bash -n` under 3.2 and 5.x; no CRLF; no bash-4-only builtins outside guarded regions                                                                 | `aaa-testing` |

## Manual smoke checklist

Static checks (`bash -n` on bash 3.2.57 and 5.3.20, `shellcheck -x`, CRLF/attribute/exec-bit
checks, and probes of every `common.sh` function) all passed — see the tester's result report
for the full command list. Everything below could **not** be exercised in the sandbox (no VM, no
Git Bash, no bash 4.0–4.2 build, no Docker daemon) and must be run by hand before this work is
considered proven end-to-end.

### Prerequisites

- [ ] `bash --version` on every machine that will run these scripts reports 4.3 or newer.
- [ ] Docker is running locally (`docker info` succeeds) and, for remote scenarios, on the VM.
- [ ] `apps/server/.env.<env>` and `apps/client/.env.<env>` exist, hand-authored from
      `apps/server/.env.example` / `apps/client/.env.example`, for each environment you test.

### Missing env file

- [ ] Rename or move `apps/server/.env.development` (or use an environment with no env file) and
      run `bash scripts/01_run_docker_infra.sh`, choosing `local` / `development`.
      Expect: a die message naming the exact missing path and its `.env.example` pointer, a
      non-zero exit, and no containers started (`docker compose -f docker-compose-infra.yml ps`
      shows nothing new).
- [ ] Same as above but with `apps/client/.env.<env>` missing, running
      `bash scripts/02_deploy_docker_vm.sh`. Expect the die message naming the client path
      specifically, non-zero exit, before any SSH/transfer step runs.
- [ ] Restore the env file(s) afterward.

### Script 01 — local

- [ ] `bash scripts/01_run_docker_infra.sh`, choose `local`, then `development`.
- [ ] `docker compose -f docker-compose-infra.yml ps` shows both services `Up`/healthy.
- [ ] Container names are exactly `template-nest-next-mysql-development` and
      `template-nest-next-redis-development`.
- [ ] Set custom `MYSQL_PORT` / `REDIS_PORT` values in `apps/server/.env.development`, rerun, and
      confirm those are the **host**-published ports (`docker port template-nest-next-mysql-development`).
- [ ] Tear down (`docker compose -f docker-compose-infra.yml down`) when done.

### Script 01 — remote, against a VM with no repo yet

- [ ] Point `scripts/01_run_docker_infra.sh` at a fresh VM (or one that has never run script 02).
- [ ] Expect the `verify_remote_repo` error naming the remote path and pointing at
      `scripts/02_deploy_docker_vm.sh`, and no `docker compose up` attempted remotely.

### Script 02 — full deploy

- [ ] `bash scripts/02_deploy_docker_vm.sh` against a real VM; step through every prompt.
- [ ] The summary gate lists target, remote path, environment, app version, both image tags, and
      host ports, and warns that both env files will overwrite the VM's copies — read it before
      confirming.
- [ ] Confirm with `y`; the transfer runs (rsync or tar, whichever the box has), then a remote
      `docker compose up -d --build`.
- [ ] On the VM, `docker images` shows both `template-nest-next-server` and
      `template-nest-next-client` tagged **both** `:<version>-<env>` **and** `:<env>`.
- [ ] Exactly 50 lines of `docker compose logs` are tailed at the end.

### Script 02 — abort path

- [ ] Run `scripts/02_deploy_docker_vm.sh` again, answer `n` at the confirmation gate.
- [ ] Confirm nothing was transferred (no new/updated files under the remote path's mtimes) and
      nothing changed on the VM (`docker images` / `docker compose ps` unchanged from before the
      run).

### Rollback by retag

`docker-compose.yml` resolves `image:` from `APP_VERSION`/`NODE_ENV` and never reads the moving
`:<env>` tag, and the service has a `build:` section — so retagging alone plus a plain
`docker compose up -d` does **not** roll back; it silently rebuilds from whatever source is
currently checked out. Verify the real rollback path, not that one.

- [ ] Deploy at least twice to the same environment (or bump the version between deploys) so two
      or more `:<version>-<env>` images exist on the VM. Confirm with
      `docker images | grep template-nest-next` — note the older version tag to roll back to.
- [ ] **Do not** run `docker compose up -d` alone to roll back. Without `APP_VERSION` set and
      without `--no-build`, Compose falls back to `APP_VERSION:-0.0.0` (almost certainly not an
      image that exists) and, because `build:` is present, rebuilds from current source instead of
      erroring — so the operator sees "success" while actually redeploying the *new* code they
      meant to roll back away from. This is the trap; do not fall into it during the check below.
- [ ] Roll back with the command that actually works, run on the VM from the remote path (add
      `PORT=<port> CLIENT_PORT=<port>` if the original deploy used non-default host ports):
      `APP_VERSION=<old-version> NODE_ENV=<env> docker compose up -d --no-build`
      Expect: the containers restart on the **older** image, and `--no-build` means Compose errors
      out instead of silently rebuilding if that exact tag is missing.
- [ ] Confirm it is genuinely the old build, not a rebuild:
      `docker inspect --format '{{.Config.Image}}' template-nest-next-server-<env>` shows the old
      version tag, and its image ID (`docker inspect --format '{{.Image}}' ...` or the ID column in
      `docker images`) matches the older entry from the first step — not a newly-built image ID.
- [ ] Optional — verify the `:<env>` marker separately from Compose behavior: after a normal
      (non-rollback) deploy, `docker images` shows `:<env>` pointing at the same image ID as the
      newest `:<version>-<env>`. This confirms the retag marker is correct as a human-facing "what
      is live" pointer, without implying Compose ever reads it.

### Git Bash on Windows

- [ ] On a Windows box with Git Bash and **no rsync** on PATH, run
      `bash scripts/02_deploy_docker_vm.sh`.
- [ ] `transport_available` should report `tar`; confirm the log says "rsync not found; falling
      back to tar over ssh." and the transfer completes.
- [ ] Use an SSH identity file whose path contains a space, e.g.
      `C:\Users\First Last\.ssh\id_ed25519`; confirm `ssh_opts_string`'s quoting lets `ssh`/`rsync`
      receive it as one argument (connection succeeds rather than failing on a mangled path).

### WSL

- [ ] Run both `scripts/01_run_docker_infra.sh` and `scripts/02_deploy_docker_vm.sh` unmodified
      inside WSL (WSL1 and WSL2 if both are available); confirm both complete the same as on
      native Linux/macOS.

### Stock macOS (`/bin/bash` 3.2)

- [ ] `/bin/bash scripts/01_run_docker_infra.sh` on an unmodified macOS machine (no Homebrew bash
      needed for this check). Expect the actionable "requires Bash 4.3+... brew install bash"
      message and a clean non-zero exit — not a crash, parse error, or partial run.
- [ ] Repeat for `/bin/bash scripts/02_deploy_docker_vm.sh`.
