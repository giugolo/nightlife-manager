import { assertPortsFree, e2ePorts, project, runFirebase, manage } from './runtime.mjs';
await assertPortsFree(e2ePorts);
const runner = runFirebase(['emulators:exec', '--only', 'auth,firestore', '--config', 'firebase.e2e.json', '--project', project, 'npm run e2e:browser'], { CI: 'true' });
manage([runner]);
