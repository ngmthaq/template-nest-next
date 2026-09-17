#!/usr/bin/env bash
# Interactive TUI: verifies env files exist, ships the working tree to a VM over SSH, builds and
# starts the Compose stack there, retags images, and tails logs. See scripts/lib/common.sh.
set -euo pipefail

# Mirrors common.sh's own guard so a pre-4.3 bash fails here with a clear
# message instead of a cryptic parse/runtime error further down.
if [[ ${BASH_VERSINFO[0]:-0} -lt 4 || (${BASH_VERSINFO[0]:-0} -eq 4 && ${BASH_VERSINFO[1]:-0} -lt 3) ]]; then
  _bv=""; _bv_path=""; _cur_v="${BASH_VERSION%%(*}"
  if _bv_path="$(command -v bash 2>/dev/null)"; then
    _bv="$(bash -c 'echo ${BASH_VERSINFO[0]} ${BASH_VERSINFO[1]} ${BASH_VERSINFO[2]}' 2>/dev/null)" || _bv=""
  fi
  _bv_major="${_bv%% *}"; _bv_rest="${_bv#* }"; _bv_minor="${_bv_rest%% *}"; _bv_patch="${_bv_rest#* }"
  if [[ ${_bv_major:-0} -gt 4 || (${_bv_major:-0} -eq 4 && ${_bv_minor:-0} -ge 3) ]]; then
    echo "scripts/02_deploy_docker_vm.sh was started with an old bash (${_cur_v}). A suitable bash ${_bv_major}.${_bv_minor}.${_bv_patch:-0} is already installed at ${_bv_path} — you are probably running it with \`sh\`, which ignores the shebang. Run it instead as: ./scripts/02_deploy_docker_vm.sh   or   bash scripts/02_deploy_docker_vm.sh   (or \`pnpm deploy\`)." >&2
  else
    echo "scripts/02_deploy_docker_vm.sh requires Bash 4.3+ (found ${_cur_v}). On macOS: brew install bash, then re-run this script with that bash. Linux/WSL already ship a new enough bash." >&2
  fi
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# Transfer excludes: build artefacts and VCS metadata never belong on the VM.
# .env.* is deliberately NOT excluded — the user chose to ship env files from the laptop.
readonly TRANSFER_EXCLUDES=(node_modules .next .git dist build coverage storybook-static '*.log' .DS_Store)

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

check_local_requirements() {
  require_command docker "Install Docker Desktop or Docker Engine locally."
  require_command ssh "Install an OpenSSH client to reach the VM."
}

# ---------------------------------------------------------------------------
# Environment selection & verification
# ---------------------------------------------------------------------------

select_environment() {
  ui_select NODE_ENV "Select the target environment" "development" "staging" "production"
}

# Developers hand-author both env files; this only fails fast if one is missing.
check_env_files() {
  env_require_file "${REPO_ROOT}/apps/server/.env.${NODE_ENV}"
  env_require_file "${REPO_ROOT}/apps/client/.env.${NODE_ENV}"
  ui_info "Under Compose, the client's API_URL must be the internal hostname http://server:3000/api — localhost cannot reach the server container from inside the client container."
}

# ---------------------------------------------------------------------------
# Host ports & version
# ---------------------------------------------------------------------------

# These are Compose's published host ports (${PORT}/${CLIENT_PORT} from the shell), distinct from
# the in-container PORT set inside the env files themselves.
prompt_host_ports() {
  ui_info "Compose reads these from the shell, not from the env files, to publish the containers."
  ui_prompt HOST_SERVER_PORT "Published host port for the server" "3000"
  ui_prompt HOST_CLIENT_PORT "Published host port for the client" "3001"
}

resolve_version() {
  APP_VERSION="$(package_version)"
}

# ---------------------------------------------------------------------------
# Summary + confirmation gate
# ---------------------------------------------------------------------------

print_summary() {
  ui_header "Deployment summary"
  ui_info "Target:       ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
  ui_info "Remote path:  ${REMOTE_PATH}"
  ui_info "Environment:  ${NODE_ENV}"
  ui_info "App version:  ${APP_VERSION}"
  ui_info "Server image: template-nest-next-server:${APP_VERSION}-${NODE_ENV}  ->  :${NODE_ENV}"
  ui_info "Client image: template-nest-next-client:${APP_VERSION}-${NODE_ENV}  ->  :${NODE_ENV}"
  ui_info "Host ports:   server ${HOST_SERVER_PORT}, client ${HOST_CLIENT_PORT}"
  ui_warn "The following env files will be pushed and will OVERWRITE the VM's copies:"
  ui_warn "  apps/server/.env.${NODE_ENV}"
  ui_warn "  apps/client/.env.${NODE_ENV}"
}

confirm_or_abort() {
  print_summary
  ui_confirm "Proceed with this deployment?" || ui_die "Deployment aborted."
}

# ---------------------------------------------------------------------------
# Transfer
# ---------------------------------------------------------------------------

ensure_remote_path() {
  MSYS_NO_PATHCONV=1 ssh_run "mkdir -p '${REMOTE_PATH}'"
}

transfer_via_rsync() {
  local -a exclude_args=()
  local pattern
  for pattern in "${TRANSFER_EXCLUDES[@]}"; do exclude_args+=(--exclude "$pattern"); done
  MSYS_NO_PATHCONV=1 rsync -az --delete-excluded "${exclude_args[@]}" \
    -e "ssh $(ssh_opts_string)" "${REPO_ROOT}/" "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"
}

# BSD tar (macOS) and GNU tar (Linux/WSL) disagree on --exclude placement relative to other
# flags, but both accept it before the path operand, so every --exclude goes there.
transfer_via_tar() {
  local -a exclude_args=()
  local pattern
  for pattern in "${TRANSFER_EXCLUDES[@]}"; do exclude_args+=(--exclude="$pattern"); done
  tar -czf - "${exclude_args[@]}" -C "${REPO_ROOT}" . \
    | MSYS_NO_PATHCONV=1 ssh "${_SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" \
      "mkdir -p '${REMOTE_PATH}' && tar -xzf - -C '${REMOTE_PATH}'"
}

transfer_repo() {
  ui_header "Transferring repository to ${SSH_HOST}"
  ensure_remote_path
  case "$(transport_available)" in
    rsync) ui_info "Using rsync." && transfer_via_rsync ;;
    tar) ui_info "rsync not found; falling back to tar over ssh." && transfer_via_tar ;;
  esac
  ui_success "Transfer complete."
}

# ---------------------------------------------------------------------------
# Remote build, retag, logs
# ---------------------------------------------------------------------------

build_and_start_remote() {
  ui_header "Building and starting the stack on ${SSH_HOST}"
  MSYS_NO_PATHCONV=1 ssh_run "cd '${REMOTE_PATH}' && APP_VERSION='${APP_VERSION}' NODE_ENV='${NODE_ENV}' PORT='${HOST_SERVER_PORT}' CLIENT_PORT='${HOST_CLIENT_PORT}' docker compose up -d --build"
}

# Moves the moving :<env> pointer onto the image just built, so a rollback is a retag away.
retag_images() {
  ui_header "Retagging images"
  ssh_run "docker tag template-nest-next-server:${APP_VERSION}-${NODE_ENV} template-nest-next-server:${NODE_ENV}"
  ssh_run "docker tag template-nest-next-client:${APP_VERSION}-${NODE_ENV} template-nest-next-client:${NODE_ENV}"
}

tail_remote_logs() {
  ui_header "Recent logs"
  MSYS_NO_PATHCONV=1 ssh_run "cd '${REMOTE_PATH}' && docker compose logs --tail=50"
}

finish_success() {
  ui_success "Deployed version ${APP_VERSION} to ${SSH_HOST} as '${NODE_ENV}'."
  ui_success "Rollback: on the VM in ${REMOTE_PATH}, run 'APP_VERSION=<old-version> NODE_ENV=${NODE_ENV} PORT=${HOST_SERVER_PORT} CLIENT_PORT=${HOST_CLIENT_PORT} docker compose up -d --no-build' — --no-build is what stops Compose from silently rebuilding current source when that image is missing."
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

main() {
  check_local_requirements
  ssh_prompt_connection
  ssh_preflight
  select_environment
  check_env_files
  prompt_host_ports
  resolve_version
  confirm_or_abort
  transfer_repo
  build_and_start_remote
  retag_images
  tail_remote_logs
  finish_success
}

main "$@"
