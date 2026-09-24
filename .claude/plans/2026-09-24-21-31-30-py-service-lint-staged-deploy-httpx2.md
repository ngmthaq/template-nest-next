# Title: Plan — py-service follow-ups: lint-staged, VM deploy, httpx2

- Classification: feature
- Description: Lint staged Python files at commit time, include py-service in the VM deploy script, and move the tests from httpx to httpx2.

---

## Approach Summary / Goal

- Add `apps/py-service/.lintstagedrc.json` for `*.py`. It runs `pnpm exec ruff check --fix` and `pnpm exec ruff format`. `pnpm exec` puts `.venv/bin` on the PATH, so this works from the root husky hook.
- Extend `scripts/02_deploy_docker_vm.sh` the same way the server and client are handled. Also add the Python venv and cache folders to `TRANSFER_EXCLUDES`, so no broken `.venv` symlink reaches the VM.
- Replace the `httpx` dev dependency with an exact pin of `httpx2` through pnpm. This removes the Starlette deprecation warning.
- Goal: a commit that touches `.py` files gets fixed and formatted automatically, `pnpm deploy:vm` deploys all three services, and `pnpm py-service test` passes with no warning.

## Functional Requirements

- Staging a `.py` file in `apps/py-service` with a fixable lint issue or bad formatting, then committing, results in a fixed and formatted file in the commit.
- Commits that touch no `.py` files behave exactly as before.
- The deploy script:
  - checks that `apps/py-service/.env.${NODE_ENV}` exists
  - asks for `HOST_PY_SERVICE_PORT` (default `8000`)
  - passes `PY_SERVICE_PORT` to `docker compose up`
  - shows the py-service image, port, and env file in the summary
  - retags `template-nest-next-py-service:${APP_VERSION}-${NODE_ENV}` to `:${NODE_ENV}`
  - includes `PY_SERVICE_PORT` in the rollback hint
- `TRANSFER_EXCLUDES` adds `.venv`, `__pycache__`, `.mypy_cache`, `.pytest_cache`, and `.ruff_cache`.
- `pyproject.toml` has `httpx2==2.13.1` (or the newest version) and no `httpx`. `pylock.toml` is regenerated. `pnpm py-service test` passes all 9 tests with no StarletteDeprecationWarning.

## Non-Functional Requirements

- No new npm dependencies.
- `pnpm install --frozen-lockfile` stays stable, with no change after two runs.
- The script keeps its style: `ui_*` helpers, `ssh_run`, and `MSYS_NO_PATHCONV`. `bash -n` and `shellcheck` (if installed) pass.
- The Docker image still builds and `/health` returns 200. The runtime image must not include httpx2, because it is a dev dependency.

## Files in Scope

- Create: `apps/py-service/.lintstagedrc.json`
- Modify: `scripts/02_deploy_docker_vm.sh`, `apps/py-service/pyproject.toml`, `apps/py-service/pylock.toml` (regenerated), `apps/py-service/README.md` (lint-staged + deploy notes), `README.md` / `apps/server/README.md` (only where they describe the deploy script and list only server/client)

## Risks & Assumptions

- **Assumption:** lint-staged 17 runs each app's config with that app folder as the working directory, so `pnpm exec` finds the py-service venv. The developer proves this with a real test commit, which is then reset (not pushed).
- **Risk:** py-service's port gets published on the VM like the server and client. If the service should only be internal later, that is a separate change.
- **Risk:** Nobody can run the deploy script end to end without a VM. We check it with `bash -n`, shellcheck, and a code read, not a real deploy.
- **Assumption:** FastAPI's `TestClient` works with `httpx2` in place of `httpx`. If it does not, the developer stops and reports back.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | DONE | Add `apps/py-service/.lintstagedrc.json` (`*.py` → `pnpm exec ruff check --fix`, `pnpm exec ruff format`) and a docs note | developer | none | A test commit with a badly formatted `.py` file shows the fixed file in the commit, and the test commit is then undone. A commit without `.py` files is unchanged. | `clean-code` |
| 2 | DONE | Add py-service to `scripts/02_deploy_docker_vm.sh`: env check, port prompt, summary, compose env, retag, rollback hint, `TRANSFER_EXCLUDES` | developer | none | `bash -n` passes, shellcheck passes (if installed), and every server/client spot has a matching py-service line. Docs are updated. | `clean-code`, `security-scanner` |
| 3 | DONE | Replace `httpx` with `httpx2` (exact pin) with pnpm, and regenerate `pylock.toml` | developer | none | 9 tests pass with no deprecation warning. Lint, format, and typecheck pass. `--frozen-lockfile` passes twice with no change. The Docker build still works, and httpx2 is not in the image. | `clean-code` |

## Execution note (Root Agent)

- For task 1, the proof runs `pnpm exec lint-staged` at the repo root on a staged test file instead of a real commit. A real commit would run the husky hook, which also bumps the root version in `package.json`. The staged test file is removed afterwards. Same check, no side effects.
- **Final status:** tasks 1–3 are DONE. Review accepted on 2026-09-24.

## Amendment (user-approved, after review)

- **Task 4 (developer):** remove the `APP_ENV=development` key and its comment from `apps/py-service/.env.example`, and reword its header to match `apps/server`/`apps/client` ("Copy to .env.<APP_ENV>. The start scripts set APP_ENV, which picks the file to load; …"). Fix `apps/py-service/README.md` if it lists `APP_ENV` as a file key. `Settings.app_env` stays. Acceptance: no `APP_ENV=` line in `.env.example`; header matches the other apps; README consistent; lint/format/typecheck/test pass. Then commit everything on `main`.
- **Task 4:** DONE. Review accepted on 2026-09-24.
