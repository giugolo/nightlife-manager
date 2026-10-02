import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyCpyRBqTFBaSVJnZhGpk_Kwk971fLNh1Cw",
  authDomain: "nightlife-manager-app.firebaseapp.com",
  projectId: "nightlife-manager-app",
  storageBucket: "nightlife-manager-app.firebasestorage.app",
  messagingSenderId: "396662426294",
  appId: "1:396662426294:web:0040672293e3930733f417"
};

// Development always uses disposable emulators. A demo-* project has no live
// Firebase resources, so missing emulators fail instead of reaching production.
const useEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_EMULATORS === 'true';
const app = initializeApp(useEmulators ? {
  apiKey: 'demo-key',
  authDomain: 'demo-nightlife-manager.firebaseapp.com',
  projectId: 'demo-nightlife-manager',
  appId: 'demo-nightlife-manager'
} : firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Development and E2E use the Firebase Local Emulator Suite and skip App Check.
// Production builds retain the existing live project and App Check configuration.
if (useEmulators) {
  const authPort = Number(import.meta.env.VITE_AUTH_EMULATOR_PORT || 9099);
  const firestorePort = Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080);
  connectAuthEmulator(auth, `http://127.0.0.1:${authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', firestorePort);
} else if (typeof window !== 'undefined') {
  // Firebase App Check - Protects backend resources from abuse (reCAPTCHA v3).
  // Enable debug token for localhost development.
  if (window.location.hostname === 'localhost') {
    // @ts-expect-error - Debug token for development
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // reCAPTCHA v3 site key: overridable via env, with the project's public key as
  // fallback. (App Check site keys are public by design; enforcement is toggled
  // server-side in the Firebase console.)
  const recaptchaSiteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Leqhi4sAAAAAPDZDDwl9-M5bZSP6YBEFzXY2EEz';

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}

export default app;
