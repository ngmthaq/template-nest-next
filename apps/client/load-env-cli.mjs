import { spawn } from 'node:child_process';

import { loadAppEnv } from './load-env.mjs';

loadAppEnv();

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('load-env-cli: no command given');
  process.exit(1);
}

const env = { ...process.env };
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
