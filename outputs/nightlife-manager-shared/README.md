> **Ambiente condiviso e agenti AI:** parti da [QUICKSTART.md](QUICKSTART.md).
> Pubblicazione e protezioni: [docs/SHARED-ENVIRONMENT.md](docs/SHARED-ENVIRONMENT.md).
> Il README storico sotto può descrivere comandi o configurazioni precedenti; per sviluppo e test prevale QUICKSTART.

# Dioniso 🌙

Gestione di liste PR ed eventi per locali notturni. App **React 19 + Vite + TypeScript** con backend **Firebase** (Auth, Firestore, Hosting, App Check). Multi-tenant: ogni organizzazione vede solo i propri dati.

## Funzionalità

- **Eventi**: creazione e gestione (data, luogo, capienza, prezzi liste).
- **PR & Liste**: ogni PR ha liste con link pubblico per la registrazione ospiti.
- **Registrazione pubblica** (`/lista/:token`): form ospite con countdown e chiusura automatica liste; conferma via email (EmailJS, opzionale).
- **Check-in door** (`/checkin/:eventId?token=…`): pagina mobile con auth anonima per lo staff all'ingresso.
- **Tavoli**: gestione tavoli/privé con prezzi.
- **Multi-tenancy**: organizzazioni isolate, onboarding e migrazione dati legacy.
- **Inviti staff** (`/invite/:token`): invito membri con token (scadenza 7 giorni).
- **Dashboard**: statistiche, revenue, export CSV / mailing list.

## Prerequisiti

- Node.js 20+
- Un progetto Firebase (Auth email/password + Anonymous, Firestore, App Check con reCAPTCHA v3)

## Setup locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Crea `.env.local` nella root con la configurazione Firebase e (opzionale) EmailJS:
   ```bash
   # Firebase (vedi services/firebase.ts per i nomi esatti usati)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   # EmailJS (opzionale: senza queste, l'invio email è un no-op silenzioso)
   VITE_EMAILJS_PUBLIC_KEY=...
   VITE_EMAILJS_SERVICE_ID=...
   VITE_EMAILJS_TEMPLATE_GUEST=...
   ```
3. Avvia in sviluppo:
   ```bash
   npm run dev
   ```

## Script

| Comando | Descrizione |
|---|---|
| `npm run dev` | Dev server Vite (porta 3000) |
| `npm run build` | Build di produzione in `dist/` |
| `npm run preview` | Anteprima della build |
| `npm run lint` | ESLint |
| `npm run test` | Test (Vitest) |

## Rotte pubbliche

| Rotta | Pagina | Auth |
|---|---|---|
| `/` | App eventi (admin/staff) | Richiesta |
| `/lista/:token` | Registrazione ospite pubblica | Nessuna |
| `/checkin/:eventId?token=…` | Check-in door | Anonima |
| `/invite/:token` | Accettazione invito staff | Login/registrazione |

> Il routing è gestito manualmente leggendo `window.location` in [App.tsx](App.tsx). L'hosting (`firebase.json`) fa rewrite di queste rotte verso `index.html`.

## Deploy (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules   # quando cambiano le security rules
```

## Sicurezza

- Isolamento tenant e validazione lato server tramite [firestore.rules](firestore.rules).
- App Check (reCAPTCHA v3) e token generati con `crypto.getRandomValues`.
- Limite noto: senza Cloud Functions non c'è rate limiting server-side sulle registrazioni pubbliche (mitigato da App Check + reCAPTCHA). Dettagli in [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md).
