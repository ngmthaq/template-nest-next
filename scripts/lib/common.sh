#!/usr/bin/env bash
# Shared bash TUI + env/SSH helper library. Sourced by scripts/01_run_docker_infra.sh and
# scripts/02_deploy_docker_vm.sh — never execute directly, never `set -e` in here.

if [[ -n "${COMMON_SH_LOADED:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi
COMMON_SH_LOADED=1

# Namerefs need 4.3, `declare -gA` needs 4.2 — RHEL/CentOS 7's stock 4.2 would
# otherwise pass a plain "-lt 4" check and die later with a cryptic error.
if [[ ${BASH_VERSINFO[0]:-0} -lt 4 || (${BASH_VERSINFO[0]:-0} -eq 4 && ${BASH_VERSINFO[1]:-0} -lt 3) ]]; then
  _bv=""; _bv_path=""; _cur_v="${BASH_VERSION%%(*}"
  if _bv_path="$(command -v bash 2>/dev/null)"; then
    _bv="$(bash -c 'echo ${BASH_VERSINFO[0]} ${BASH_VERSINFO[1]} ${BASH_VERSINFO[2]}' 2>/dev/null)" || _bv=""
  fi
  _bv_major="${_bv%% *}"; _bv_rest="${_bv#* }"; _bv_minor="${_bv_rest%% *}"; _bv_patch="${_bv_rest#* }"
  if [[ ${_bv_major:-0} -gt 4 || (${_bv_major:-0} -eq 4 && ${_bv_minor:-0} -ge 3) ]]; then
    echo "scripts/lib/common.sh was sourced under an old bash (${_cur_v}). A suitable bash ${_bv_major}.${_bv_minor}.${_bv_patch:-0} is already installed at ${_bv_path} — the script that sourced this library is probably being run with \`sh\`, which ignores its shebang. Re-run that script directly (./<script>) or via bash <script>." >&2
  else
    echo "scripts/lib/common.sh requires Bash 4.3+ (found ${_cur_v}). On macOS: brew install bash, then re-run the sourcing script with that bash. Linux/WSL already ship a new enough bash." >&2
  fi
  return 1 2>/dev/null || exit 1
fi

_COMMON_SH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
_COMMON_SH_REPO_ROOT="$(cd "${_COMMON_SH_DIR}/../.." >/dev/null 2>&1 && pwd)"

# Disable ANSI color codes when stdout isn't a terminal (piped/redirected output).
if [[ -t 1 ]]; then
  _UI_BOLD=$'\033[1m'; _UI_RESET=$'\033[0m'
  _UI_RED=$'\033[31m'; _UI_GREEN=$'\033[32m'; _UI_YELLOW=$'\033[33m'; _UI_CYAN=$'\033[36m'
else
  _UI_BOLD=""; _UI_RESET=""; _UI_RED=""; _UI_GREEN=""; _UI_YELLOW=""; _UI_CYAN=""
fi

readonly _ENV_KEY_RE='^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$'
declare -ga _SSH_OPTS=()

# ---------------------------------------------------------------------------
# UI: output
# ---------------------------------------------------------------------------

_ui_style() {
  printf '%s%s%s' "$1" "$2" "$_UI_RESET"
}

ui_header() {
  printf '\n%s\n' "$(_ui_style "$_UI_BOLD" "== $1 ==")"
  return 0
}

ui_info() {
  printf '%s\n' "$1"
  return 0
}

ui_warn() {
  printf '%s\n' "$(_ui_style "$_UI_YELLOW" "$1")" >&2
  return 0
}

ui_success() {
  printf '%s\n' "$(_ui_style "$_UI_GREEN" "$1")" >&2
  return 0
}

ui_error() {
  printf '%s\n' "$(_ui_style "$_UI_RED" "$1")" >&2
  return 0
}

ui_die() {
  ui_error "$1"
  exit 1
}

# ---------------------------------------------------------------------------
# UI: input
# ---------------------------------------------------------------------------

# Shared EOF failure for every prompt below — closed stdin (Ctrl-D, a pipe
# that ran out, CI) must never leave a caller's variable unset under set -u.
_ui_die_on_eof() {
  ui_die "No input received — these scripts are interactive. Run from a terminal, or press Ctrl-C to cancel."
}

# Reads into $1 by name. Loops on empty input unless a default ($3) was passed,
# even an empty-string default, which is accepted as-is.
ui_prompt() {
  local -n _ui_prompt_out="$1"
  local label="$2"
  local default="" has_default=0 input read_rc
  if [[ $# -ge 3 ]]; then default="$3"; has_default=1; fi
  while true; do
    read_rc=0
    if [[ $has_default -eq 1 ]]; then
      read -r -p "$(_ui_style "$_UI_CYAN" "${label} [${default}]: ")" input || read_rc=$?
    else
      read -r -p "$(_ui_style "$_UI_CYAN" "${label}: ")" input || read_rc=$?
    fi
    if [[ $read_rc -ne 0 ]]; then
      _ui_die_on_eof
    fi
    if [[ -z "$input" && $has_default -eq 1 ]]; then input="$default"; fi
    if [[ -n "$input" || $has_default -eq 1 ]]; then
      _ui_prompt_out="$input"
      return 0
    fi
    ui_warn "A value is required."
  done
}

# Same contract as ui_prompt but hidden input; disables xtrace so a secret
# never lands in a `set -x` trace.
ui_prompt_secret() {
  local -n _ui_prompt_secret_out="$1"
  local label="$2"
  local default="" has_default=0 input xtrace_on=0 read_rc
  if [[ $# -ge 3 ]]; then default="$3"; has_default=1; fi
  case "$-" in *x*) xtrace_on=1 ;; esac
  set +x
  while true; do
    read_rc=0
    if [[ $has_default -eq 1 ]]; then
      read -rs -p "$(_ui_style "$_UI_CYAN" "${label} [hidden, press enter to keep current]: ")" input || read_rc=$?
    else
      read -rs -p "$(_ui_style "$_UI_CYAN" "${label}: ")" input || read_rc=$?
    fi
    printf '\n'
    if [[ $read_rc -ne 0 ]]; then
      if [[ $xtrace_on -eq 1 ]]; then set -x; fi
      _ui_die_on_eof
    fi
    if [[ -z "$input" && $has_default -eq 1 ]]; then input="$default"; fi
    if [[ -n "$input" || $has_default -eq 1 ]]; then
      _ui_prompt_secret_out="$input"
      break
    fi
    ui_warn "A value is required."
  done
  if [[ $xtrace_on -eq 1 ]]; then set -x; fi
  return 0
}

ui_confirm() {
  local answer read_rc=0
  read -r -p "$(_ui_style "$_UI_CYAN" "${1} [y/N]: ")" answer || read_rc=$?
  if [[ $read_rc -ne 0 ]]; then
    _ui_die_on_eof
  fi
  case "$answer" in
    [Yy] | [Yy][Ee][Ss]) return 0 ;;
    *) return 1 ;;
  esac
}

ui_select() {
  local -n _ui_select_out="$1"
  local label="$2"
  shift 2
  local opt
  local PS3
  local chosen=0
  ui_info "$label"
  PS3="$(_ui_style "$_UI_CYAN" "Choose an option: ")"
  select opt in "$@"; do
    if [[ -n "$opt" ]]; then
      _ui_select_out="$opt"
      chosen=1
      break
    fi
    ui_warn "Invalid choice, try again."
  done
  if [[ $chosen -ne 1 ]]; then
    _ui_die_on_eof
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Env handling: read primitives
# ---------------------------------------------------------------------------

# Strips one layer of matching quotes; unescapes \" and \\ inside double
# quotes, leaves single-quoted content literal. Still needed by env_value.
_env_unquote() {
  local raw="$1"
  if [[ "$raw" =~ ^\"(.*)\"$ ]]; then
    raw="${BASH_REMATCH[1]}"
    raw="${raw//\\\"/\"}"
    raw="${raw//\\\\/\\}"
  elif [[ "$raw" =~ ^\'(.*)\'$ ]]; then
    raw="${BASH_REMATCH[1]}"
  fi
  printf '%s' "$raw"
  return 0
}

env_keys() {
  local file="$1" line
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ $_ENV_KEY_RE ]]; then
      printf '%s\n' "${BASH_REMATCH[1]}"
    fi
  done < "$file"
  return 0
}

env_value() {
  local file="$1" want_key="$2" line
  if [[ -f "$file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" =~ $_ENV_KEY_RE ]] && [[ "${BASH_REMATCH[1]}" == "$want_key" ]]; then
        _env_unquote "${BASH_REMATCH[2]}"
        return 0
      fi
    done < "$file"
  fi
  printf '%s' ""
  return 0
}

# ---------------------------------------------------------------------------
# Env handling: validation
# ---------------------------------------------------------------------------

# Dies when path is missing, naming the matching .env.example so the
# developer knows what to copy. Developers hand-author real env files now.
env_require_file() {
  local path="$1" example
  if [[ ! -f "$path" ]]; then
    example="$(printf '%s' "$path" | sed -E 's/\.env\.[^./]+$/.env.example/')"
    ui_die "${path} not found. Copy ${example} and fill it in."
  fi
  return 0
}

# ---------------------------------------------------------------------------
# Misc: version + command checks
# ---------------------------------------------------------------------------

# Reads `version` with sed/grep only — jq/node aren't guaranteed on a VM.
package_version() {
  local file="${1:-${_COMMON_SH_REPO_ROOT}/package.json}" version
  [[ -f "$file" ]] || ui_die "package.json not found at $file"
  version="$(grep -m1 '"version"[[:space:]]*:' "$file" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
  [[ -n "$version" ]] || ui_die "Could not read a version from $file"
  printf '%s' "$version"
  return 0
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || ui_die "Missing required command '${1}'. ${2}"
}

# ---------------------------------------------------------------------------
# Platform
# ---------------------------------------------------------------------------

# True under Git Bash, MSYS2, or Cygwin, where rsync is typically absent and
# POSIX-looking paths get silently rewritten by MSYS's path conversion.
platform_is_msys() {
  case "${OSTYPE:-}" in
    msys* | cygwin*) return 0 ;;
  esac
  case "$(uname -s 2>/dev/null)" in
    MINGW* | MSYS* | CYGWIN*) return 0 ;;
  esac
  return 1
}

# Echoes the transfer tool script 02 should use: `rsync` when available,
# otherwise `tar` (Git Bash ships no rsync) as a tar-over-ssh fallback.
transport_available() {
  if command -v rsync >/dev/null 2>&1; then
    printf '%s' "rsync"
  else
    printf '%s' "tar"
  fi
  return 0
}

# ---------------------------------------------------------------------------
# SSH
# ---------------------------------------------------------------------------

ssh_prompt_connection() {
  ui_prompt SSH_HOST "Remote SSH host"
  ui_prompt SSH_USER "Remote SSH user" "root"
  ui_prompt SSH_PORT "Remote SSH port" "22"
  ui_prompt SSH_IDENTITY "SSH identity file (blank = ssh-agent / ~/.ssh/config)" ""
  ui_prompt REMOTE_PATH "Remote deploy path" "/srv/template-nest-next"
  export SSH_HOST SSH_USER SSH_PORT SSH_IDENTITY REMOTE_PATH
  _SSH_OPTS=(-p "$SSH_PORT")
  if [[ -n "${SSH_IDENTITY:-}" ]]; then
    _SSH_OPTS+=(-i "$SSH_IDENTITY")
  fi
}

# Shell-quotes each _SSH_OPTS element via `%q` into one string, safe to embed
# in rsync's `-e "ssh $(ssh_opts_string)"` even when SSH_IDENTITY has spaces.
ssh_opts_string() {
  local opt quoted="" formatted
  for opt in "${_SSH_OPTS[@]}"; do
    printf -v formatted '%q' "$opt"
    quoted="${quoted:+$quoted }${formatted}"
  done
  printf '%s' "$quoted"
  return 0
}

ssh_run() {
  ssh -o BatchMode=yes "${_SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "$1"
}

ssh_preflight() {
  require_command ssh "Install the OpenSSH client to continue."
  ui_info "Checking SSH connectivity to ${SSH_USER}@${SSH_HOST}..."
  ssh -o BatchMode=yes -o ConnectTimeout=10 "${_SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "true" \
    || ui_die "Cannot reach ${SSH_USER}@${SSH_HOST}. Check host/user/port/identity and that the key is authorized."
  ssh_run "command -v docker" >/dev/null \
    || ui_die "docker was not found on ${SSH_HOST}. Install Docker before continuing."
  ssh_run "docker compose version" >/dev/null \
    || ui_die "docker compose (v2 plugin) was not found on ${SSH_HOST}. Install the Compose plugin."
  ui_success "Remote host is reachable and has Docker + Compose."
}
