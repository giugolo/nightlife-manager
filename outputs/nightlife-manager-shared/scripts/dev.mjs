import { assertPortsFree, devPorts, viteCLI, project, run, runFirebase, manage } from './runtime.mjs';
await assertPortsFree(devPorts);
const emulators = runFirebase(['emulators:start', '--only', 'auth,firestore', '--config', 'firebase.dev.json', '--project', project]);
const frontend = run(process.execPath, [viteCLI, '--port', '3000'], {
  VITE_USE_EMULATORS: 'true', VITE_AUTH_EMULATOR_PORT: '9099', VITE_FIRESTORE_EMULATOR_PORT: '8080'
});
manage([emulators, frontend]);
console.log('Demo locale: http://localhost:3000/app — dati temporanei; attendi Auth e Firestore pronti.');
