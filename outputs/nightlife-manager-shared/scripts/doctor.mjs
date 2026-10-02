import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { firebaseCLI, root } from './runtime.mjs';
let failures = 0;
function check(ok, text) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${text}`);
  if (!ok) failures++;
}
const expected = readFileSync(`${root}.nvmrc`, 'utf8').trim();
check(process.versions.node === expected, `Node ${expected} (attuale: ${process.versions.node})`);
const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
const javaVersion = Number((java.stderr || java.stdout || '').match(/version "(\d+)/)?.[1]);
check(java.status === 0 && javaVersion >= 21, `Java >=21 (attuale: ${javaVersion || 'non trovato'})`);
check(existsSync(firebaseCLI), 'Firebase CLI installata dal lockfile locale');
check(existsSync(`${root}node_modules/@playwright/test`), 'Playwright installato');
const demo = JSON.parse(readFileSync(`${root}firebase.dev.json`, 'utf8'));
check(!demo.hosting && !demo.functions && demo.emulators.auth.host === '127.0.0.1', 'Config sviluppo senza deploy e con emulatori loopback');
console.log('Il browser Chromium si verifica eseguendo npm run e2e. Nessuna verifica remota o produzione.');
process.exitCode = failures ? 1 : 0;
