#!/usr/bin/env bash
# Interactive TUI: bring up MySQL + Redis (docker-compose-infra.yml) for a chosen
# environment, locally or on a remote VM already provisioned by script 02.
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
    echo "scripts/01_run_docker_infra.sh was started with an old bash (${_cur_v}). A suitable bash ${_bv_major}.${_bv_minor}.${_bv_patch:-0} is already installed at ${_bv_path} — you are probably running it with \`sh\`, which ignores the shebang. Run it instead as: ./scripts/01_run_docker_infra.sh   or   bash scripts/01_run_docker_infra.sh   (or \`pnpm infra\`)." >&2
  else
    echo "scripts/01_run_docker_infra.sh requires Bash 4.3+ (found ${_cur_v}). On macOS: brew install bash, then re-run this script with that bash. Linux/WSL already ship a new enough bash." >&2
  fi
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

readonly COMPOSE_FILE="docker-compose-infra.yml"

# Fails fast if script 02 hasn't deployed the repo yet, since this script
# never transfers files itself.
verify_remote_repo() {
  ui_info "Checking ${REMOTE_PATH} on ${SSH_HOST}..."
  MSYS_NO_PATHCONV=1 ssh_run "[ -d '${REMOTE_PATH}' ]" \
    || ui_die "Remote path ${REMOTE_PATH} does not exist on ${SSH_HOST}. Run scripts/02_deploy_docker_vm.sh first."
  MSYS_NO_PATHCONV=1 ssh_run "[ -f '${REMOTE_PATH}/${COMPOSE_FILE}' ]" \
    || ui_die "${COMPOSE_FILE} not found under ${REMOTE_PATH} on ${SSH_HOST}. Run scripts/02_deploy_docker_vm.sh first."
}

print_summary() {
  local target="$1" environment="$2" env_file="$3" mysql_port="$4" redis_port="$5"
  local target_label="local"
  if [[ "$target" == "remote" ]]; then
    target_label="${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
  fi
  ui_header "Summary"
  ui_info "Target:      ${target_label}"
  ui_info "Environment: ${environment}"
  ui_info "Env file:    ${env_file}"
  ui_info "MySQL port:  ${mysql_port}"
  ui_info "Redis port:  ${redis_port}"
}

# Compose interpolates MYSQL_PORT/REDIS_PORT from the shell, not env_file:,
# so both must be exported into whichever process runs `compose up`.
compose_up() {
  local target="$1" environment="$2" mysql_port="$3" redis_port="$4"
  if [[ "$target" == "remote" ]]; then
    MSYS_NO_PATHCONV=1 ssh_run \
      "cd '${REMOTE_PATH}' && NODE_ENV='${environment}' MYSQL_PORT='${mysql_port}' REDIS_PORT='${redis_port}' docker compose -f ${COMPOSE_FILE} up -d"
  else
    NODE_ENV="$environment" MYSQL_PORT="$mysql_port" REDIS_PORT="$redis_port" \
      docker compose -f "$COMPOSE_FILE" up -d
  fi
}

show_status() {
  local target="$1" environment="$2"
  if [[ "$target" == "remote" ]]; then
    MSYS_NO_PATHCONV=1 ssh_run "cd '${REMOTE_PATH}' && docker compose -f ${COMPOSE_FILE} ps"
  else
    docker compose -f "$COMPOSE_FILE" ps
  fi
  ui_success "template-nest-next-mysql-${environment} and template-nest-next-redis-${environment} are up."
}

main() {
  require_command docker "Install Docker Desktop or the Docker Engine before continuing."
  cd "$REPO_ROOT"

  ui_header "Docker infra: MySQL + Redis"

  local target
  ui_select target "Where should the stack run?" "local" "remote"

  if [[ "$target" == "remote" ]]; then
    ssh_prompt_connection
    ssh_preflight
    verify_remote_repo
  fi

  local environment
  ui_select environment "Which environment?" "development" "staging" "production"

  local env_file="apps/server/.env.${environment}"
  env_require_file "$env_file"

  local mysql_port redis_port
  mysql_port="$(env_value "$env_file" "MYSQL_PORT")"
  redis_port="$(env_value "$env_file" "REDIS_PORT")"
  mysql_port="${mysql_port:-3306}"
  redis_port="${redis_port:-6379}"

  print_summary "$target" "$environment" "$env_file" "$mysql_port" "$redis_port"
  ui_confirm "Bring up MySQL + Redis with these settings?" || ui_die "Aborted."

  compose_up "$target" "$environment" "$mysql_port" "$redis_port"
  show_status "$target" "$environment"
}

main "$@"
