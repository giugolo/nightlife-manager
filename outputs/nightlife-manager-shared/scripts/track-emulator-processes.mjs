// Observes the pinned Firebase CLI's child launches; it does not change them.
// Recheck this integration whenever firebase-tools is updated.
import childProcess from 'node:child_process';
const originalSpawn = childProcess.spawn;

function report(kind, pid) {
  if (process.connected && process.send) {
    process.send({ kind, pid }, () => {});
  }
}

childProcess.spawn = function (...args) {
  const child = originalSpawn.apply(this, args);
  const [command, commandArgs, options] = args;
  if (command === 'java' && options?.detached && Array.isArray(commandArgs)
      && commandArgs.some(arg => typeof arg === 'string' && arg.includes('cloud-firestore-emulator'))) {
    if (child.pid) report('emulator-started', child.pid);
    child.once('exit', () => report('emulator-exited', child.pid));
  }
  return child;
};
