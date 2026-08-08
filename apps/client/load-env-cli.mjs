import { spawn } from 'node:child_process';
import { loadAppEnv } from './load-env.mjs';

/**
 * Launcher that loads the per-environment .env files (see load-env.mjs) into
 * process.env *before* running the given command. Needed because next dev /
 * next start resolve PORT (and other startup vars) before Next loads env files
 * itself — so the port can live in .env instead of a hard-coded -p flag.
 *
 *   node load-env-cli.mjs next dev
 */
loadAppEnv();

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('load-env-cli: no command given');
  process.exit(1);
}

const env = { ...process.env };
// `INSPECT=1` (start:debug) attaches the Node inspector to the spawned child
// only. Setting --inspect on this wrapper process instead would claim the debug
// port and leave the actual Next.js process undebuggable.
if (env.INSPECT) {
  env.NODE_OPTIONS = [env.NODE_OPTIONS, '--inspect'].filter(Boolean).join(' ');
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
