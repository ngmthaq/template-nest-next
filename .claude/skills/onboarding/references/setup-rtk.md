# RTK Setup

RTK is a CLI proxy that cuts LLM token use by 60–90% on development commands. It is a single Rust program. It filters and shortens command output before the output reaches the assistant's context window. See [rtk on GitHub](https://github.com/rtk-ai/rtk/tree/develop).

## Install

```bash
# Homebrew (recommended)
brew install rtk

# Quick install script (Linux/macOS)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo
cargo install --git https://github.com/rtk-ai/rtk
```

If you used the install script, make sure `~/.local/bin` is on `PATH`. Check the install:

```bash
rtk --version
```

## Register with Claude Code

```bash
rtk init -g          # Claude Code / Copilot (default), global
rtk init -g --auto-patch   # non-interactive, for CI/CD
```

Restart Claude Code after this to turn on the auto-rewrite hook. The hook catches Bash commands and quietly changes them to their RTK version (e.g. `git status` → `rtk git status`). Claude Code's built-in `Read`, `Grep`, and `Glob` tools do not go through the hook — use shell commands or call `rtk` directly to save tokens there.

## Common commands

```bash
rtk git status / log / diff   # compact git
rtk ls .                      # token-optimized directory tree
rtk grep "pattern" .          # grouped search results
rtk cargo test / pytest / jest / go test   # tests, failures-focused
rtk tsc / lint / ruff check   # build and lint, grouped
```

## Check savings

```bash
rtk gain            # token savings summary
rtk gain --graph    # ASCII graph over 30 days
rtk discover        # find missed savings opportunities
```

## Notes

- Config lives at `~/.config/rtk/config.toml` (macOS: `~/Library/Application Support/rtk/config.toml`).
- Telemetry is off by default. Turn it on with `rtk telemetry enable`.
- On Windows, use WSL to get all features, including the auto-rewrite hook.
