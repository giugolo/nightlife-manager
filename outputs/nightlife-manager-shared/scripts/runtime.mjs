import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const firebaseCLI = fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url));
export const viteCLI = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const emulatorTracker = fileURLToPath(new URL('./track-emulator-processes.mjs', import.meta.url));
export const project = 'demo-nightlife-manager';
export const devPorts = [3000, 9099, 8080, 4400, 4500, 9150];
export const e2ePorts = [13000, 19099, 18080, 14400, 14500, 19150];

export async function assertPortsFree(ports) {
  for (const port of ports) {
    await new Promise((resolve, reject) => {
      const server = createServer();
      server.once('error', () => reject(new Error(`Porta ${port} occupata: ferma il tuo ambiente precedente. Nessun processo verra' terminato automaticamente.`)));
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
}

// Each launch owns a process group. Never kill by process name or port.
export function run(command, args, extraEnv = {}, trackEmulators = false) {
  const child = spawn(command, args, {
    cwd: root, stdio: trackEmulators ? ['inherit', 'inherit', 'inherit', 'ipc'] : 'inherit', detached: process.platform !== 'win32',
    env: { ...process.env, ...extraEnv }
  });
  child.emulatorGroups = new Set();
  if (trackEmulators) child.on('message', message => {
    if (!Number.isSafeInteger(message?.pid) || message.pid <= 1) return;
    if (message.kind === 'emulator-started') child.emulatorGroups.add(message.pid);
    if (message.kind === 'emulator-exited') child.emulatorGroups.delete(message.pid);
  });
  return child;
}

export function runFirebase(args, extraEnv = {}) {
  return run(process.execPath, ['--import', emulatorTracker, firebaseCLI, ...args], extraEnv, true);
}

export function stop(child, signal = 'SIGTERM') {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

export function manage(children) {
  let closing = false;
  const close = code => {
    if (closing) return;
    closing = true;
    process.exitCode = code;
    for (const child of children) stop(child);
    // Firebase launches Java detached. Track its actual spawn over private IPC,
    // without scanning unrelated processes or identifying them by name/port.
    const emulatorAlive = () => {
      let alive = false;
      for (const child of children) for (const pid of child.emulatorGroups) {
        try {
          process.kill(process.platform === 'win32' ? pid : -pid, 0);
          alive = true;
        } catch (error) {
          if (error.code === 'ESRCH') child.emulatorGroups.delete(pid);
          else throw error;
        }
      }
      return alive;
    };
    const timer = setTimeout(() => {
      clearInterval(poll);
      for (const child of children) stop(child, 'SIGKILL');
      for (const child of children) for (const pid of child.emulatorGroups) {
        try { process.kill(process.platform === 'win32' ? pid : -pid, 'SIGKILL'); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
      setTimeout(() => process.exit(code), 100);
    }, 5000);
    const poll = setInterval(() => {
      const launchersExited = children.every(child => child.exitCode !== null || child.signalCode !== null);
      if (launchersExited && !emulatorAlive()) {
        clearInterval(poll);
        clearTimeout(timer);
        process.exit(code);
      }
    }, 50);
  };
  process.once('SIGINT', () => close(130));
  process.once('SIGTERM', () => close(143));
  for (const child of children) {
    child.once('error', error => { console.error(error.message); close(1); });
    child.once('exit', (code, signal) => close(code ?? (signal ? 1 : 0)));
  }
}
