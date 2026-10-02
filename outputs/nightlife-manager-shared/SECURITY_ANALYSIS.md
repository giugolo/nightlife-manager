# 🔒 NightLife Manager - Security & Bug Analysis

**Data Analisi:** 17 Dicembre 2024  
**Versione Analizzata:** v0.11.3  
**Ultimo hardening rules:** 14 Giugno 2026 (Fase 2 — validazione input + restrizione letture pubbliche)

---

## 🆕 CHANGELOG HARDENING (14 Giugno 2026 — firestore.rules)

Modifiche applicate al solo file `firestore.rules` (vincolo architetturale: client-only,
piano gratuito Firebase, NESSUNA Cloud Function → enforcement esclusivamente via security rules).

### 1. Validazione input
- Aggiunti helper `isValidEmail()`, `isBoundedString()`, `isOptionalBoundedString()`.
- **guests create** (ramo pubblico): ora richiede `name` 1..100, `email` con formato base
  via regex `^[^@]+@[^@]+\.[^@]+$` (size <= 254), `listId` non vuoto (<=200),
  e limita i campi liberi opzionali `phone` (<=40) e `notes` (<=1000).
- **guests create** (ramo org admin/staff): aggiunto bound su `name` (1..100) e `listId`.
- **events create**: bound su `name` (1..200).
- **prs create/update**: bound su `name` (1..200).
- **lists create/update**: bound su `name` (1..200). NB: `generateListPublicToken`/`getListByPublicToken`
  usano `setDoc(..., {merge:true})` quindi `name` resta presente nel documento risultante → la regola passa.
- **tables create/update**: bound sui campi liberi `primaryGuestName` (<=200) e `notes` (<=1000),
  tollerando `null` (default usato dal client).
- Il ramo **update** dei guests (check-in via door session) è stato lasciato INVARIATO e senza
  validazione di lunghezza: il door operator riscrive l'intero oggetto guest esistente
  (`saveGuest` overwrite) e aggiungere vincoli avrebbe rischiato di rompere il check-in.

### 2. Restrizione letture pubbliche (anti-enumerazione)
- **organizations**: `allow read: if true` → `allow get: if true` + `allow list: if isInOrganization(orgId)`.
  Il `get` per-documento serve a InviteAcceptPage (risolve il nome org dall'ID letto nell'invito);
  l'enumerazione dell'intera collection è ora bloccata.
- **events**: `allow read: if true` → `allow get: if true` + `allow list: if isInOrganization(resource.data.organizationId)`.
  Il `get` per-ID serve a registrazione pubblica (`getListByPublicToken`→getDoc evento) e alla
  pagina door (getDoc evento). La `list` resta possibile solo ai membri autenticati della stessa org;
  copre la query dashboard `getEvents` (filtrata `where organizationId == user.org`).
  NB: `getAllEvents` (getDocs senza filtro) NON ha più chiamanti nella UI → nessun flusso rotto.

### 3. Letture pubbliche lasciate APERTE volutamente
- **lists** (sia `match /{path=**}/lists/{listId}` collection-group sia la subcollection per-evento):
  `allow read: if true` mantenuto. Necessario perché:
  - `getListByPublicToken` esegue una **collectionGroup query** su `publicToken` (richiede `list`, non solo `get`);
  - il door operator anonimo esegue `getLists(eventId)` (query → `list`).
  I nomi delle liste non sono dati sensibili. Restringere richiederebbe Cloud Functions o un
  redesign del lookup token. Rischio: enumerabilità dei nomi-lista via collection-group query.
- **invites get** e **events get** / **organizations get**: aperti per documento singolo, ma la
  sicurezza è data dal fatto che l'ID è un token segreto (invites) o richiede di conoscere l'ID esatto.

### 4. Door token / invalidazione sessioni — ESITO VERIFICA
- La funzione `isDoorSessionValid(eventId)` (firestore.rules) **è corretta**: confronta
  `door_sessions/{uid}.token` con `events/{eventId}/private_data/config.doorToken` corrente.
  Quindi la rigenerazione del `doorToken` (`generateDoorToken`) invalida ISTANTANEAMENTE
  tutte le sessioni esistenti a livello di regole, alla prima operazione successiva.
- Caveat lato client: `firestoreService.verifyDoorSession` confronta **solo** `eventId` (non il token).
  Questo influenza solo la UI ottimistica del door operator; l'enforcement reale avviene nelle rules,
  che restano corrette. ⚠️ **DA TESTARE in incognito**: aprire door, rigenerare token da admin,
  verificare che il check-in fallisca lato server alla successiva azione.

### 5. Rate limiting — RISCHIO RESIDUO (non risolvibile)
- Non implementabile senza Cloud Functions (vincolo architetturale). Vedi sezione dedicata sotto.

---

Questo documento fornisce un'analisi completa delle vulnerabilità di sicurezza, bug noti e raccomandazioni per rendere NightLife Manager un'applicazione sicura e robusta in produzione.

---

## 📋 Executive Summary

L'applicazione è ben strutturata con un'architettura multi-tenant e regole di sicurezza Firestore dettagliate. Tuttavia, sono state identificate diverse aree critiche che richiedono attenzione prima di un utilizzo in produzione su larga scala.

### Livello di Rischio Globale: 🟢 **MEDIO** (dopo fix v0.12.3)

| Area | Rischio | Priorità | Stato |
|------|---------|----------|-------|
| ~~Privilege Escalation~~ | ~~🔴 Critico~~ | ~~P0~~ | ✅ RISOLTO v0.12.3 |
| ~~Token Security~~ | ~~🔴 Alto~~ | ~~P1~~ | ✅ RISOLTO v0.12.2 |
| Door Session Invalidation | 🟢 Basso | P2 | ✅ Rules corrette (test in incognito) |
| Rate Limiting | 🟠 Medio | P2 | ⚠️ Rischio residuo (no Cloud Functions) |
| Input Validation | 🟢 Basso | P2 | ✅ RISOLTO (14 Giu 2026) |
| Data Leakage (enumeration) | 🟢 Basso | P3 | ✅ Ridotto: events/orgs no public list |

---

## 🔴 VULNERABILITÀ CRITICHE (P1)

### 1. Token Debole per Link Pubblici e Door

**File:** `services/firestoreService.ts` (linee 20-28, 436, 465-471)

**Problema:**
```typescript
const generatePublicToken = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {  // ⚠️ Solo 8 caratteri!
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
};
```

**Vulnerabilità:**
- Token a **8 caratteri** alfanumerici = solo **36^8 ≈ 2.8 trilioni** di combinazioni
- **Brute-forceable** con attacchi distribuiti (es. ~10M tentativi/ora = enumerable in giorni)
- `Math.random()` **non è crittograficamente sicuro**
- Il `doorToken` riutilizza la stessa funzione (8 caratteri)
- L'`inviteToken` è migliore (16 caratteri) ma usa sempre `Math.random()`

**Impatto:** Un attaccante potrebbe:
1. Enumerare link pubblici per registrare ospiti falsi
2. Indovinare door token e accedere al check-in senza autorizzazione
3. Accettare inviti staff non destinati a loro

**Raccomandazione:**
```typescript
// Usare crypto.getRandomValues() per sicurezza crittografica
const generateSecureToken = (length: number = 24): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
};
```

---

### 2. Door Session NON Invalidata alla Rigenerazione Token

**File:** `PROJECT_STATUS.md` (Step 6.8), `firestore.rules` (linee 94-104)

**Problema Documentato:**
> "se il link operatore door viene rigenerato, operatore door è comunque in grado di effettuare checkin fino a che non refresha la pagina"

**Meccanismo Attuale:**
1. Admin genera `doorToken` → salvato in `events/{id}/private_data/config`
2. Door operator crea sessione → salvata in `door_sessions/{uid}` con `token` e `eventId`
3. Le security rules verificano **solo** che esista una sessione valida per l'evento
4. Se il token viene rigenerato, **le sessioni esistenti rimangono attive**

**Impatto:** Un ex-operatore door mantiene accesso fino a:
- Logout manuale
- Scadenza della sessione anonima Firebase (che può durare ore)
- Refresh della pagina (che tenta di ricreare la sessione con il vecchio token)

**Raccomandazione:**
```javascript
// Modificare le security rules per verificare anche il token corrente
function isDoorSessionValid(eventId) {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/door_sessions/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/door_sessions/$(request.auth.uid)).data.eventId == eventId &&
         // ⬇️ AGGIUNGERE: verificare che il token della sessione corrisponda al token corrente dell'evento
         get(/databases/$(database)/documents/door_sessions/$(request.auth.uid)).data.token == 
         get(/databases/$(database)/documents/events/$(eventId)/private_data/config).data.doorToken;
}
```

---

## 🟠 VULNERABILITÀ MEDIE (P2)

### 3. Mancanza di Rate Limiting sulle API

**File:** Tutte le chiamate Firestore in `firestoreService.ts`

**Problema:** Non esiste rate limiting per:
- Registrazione ospiti via link pubblico (`saveGuest`)
- Creazione inviti
- Tentativi di login falliti

**Impatto:**
- **Spam registrazioni:** Un attaccante può riempire la capacità evento con ospiti falsi
- **Enumerazione email:** Verificare quali email esistono tramite errori di login
- **DoS:** Saturare la quota Firestore con letture/scritture eccessive

**Stato (14 Giu 2026): RISCHIO RESIDUO ACCETTATO.**
Il rate limiting NON è implementabile in un'architettura client-only su piano Firebase gratuito:
le security rules non possono contare richieste nel tempo né mantenere stato per IP/sessione.
Servirebbero Cloud Functions (escluse dal vincolo architetturale).

**Mitigazioni già attive (parziali):**
1. **Firebase App Check + reCAPTCHA** (configurati in `services/firebase.ts`): riducono l'abuso
   automatizzato del form pubblico `saveGuest` filtrando richieste non provenienti dall'app legittima.
2. **Validazione input nelle rules** (vedi changelog): scarta payload malformati/oversize a monte.
3. **Token segreti come ID** (invites) e lookup per-documento: niente enumerazione diretta.

**Rischio residuo:** un attaccante che superi App Check (es. token reCAPTCHA valido) può comunque
spammare registrazioni ospiti o saturare la quota Firestore. Mitigabile solo con backend.
Raccomandazione futura: se si abbandona il vincolo no-Cloud-Functions, aggiungere rate limiting
server-side e CAPTCHA esplicito sulle registrazioni pubbliche.

---

### 4. Validazione Input Insufficiente

**File:** `firestore.rules` (linee 165-174)

**Problema:** Le regole per la registrazione ospiti sono troppo permissive:
```javascript
allow create: if (
  request.resource.data.name is string &&
  request.resource.data.name.size() > 0 &&  // ⚠️ min 1 carattere
  request.resource.data.email is string &&
  request.resource.data.email.size() > 0 && // ⚠️ nessuna validazione formato
  request.resource.data.listId is string
);
```

**Vulnerabilità:**
- Nomi di 1 carattere accettati
- Email non validate (es. "aaaa" è accettato)
- Nessun limite massimo di lunghezza
- Nessuna sanificazione HTML/XSS

**Raccomandazione:**
```javascript
// Regole migliorate
allow create: if (
  request.resource.data.name is string &&
  request.resource.data.name.size() >= 2 &&
  request.resource.data.name.size() <= 100 &&
  request.resource.data.email is string &&
  request.resource.data.email.matches('^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$') &&
  request.resource.data.listId is string
);
```

---

### 5. Lettura Pubblica su Dati Sensibili

**File:** `firestore.rules` (linee 82, 72, 108, 116, 148)

**Problema:** Molte collezioni permettono lettura pubblica:
```javascript
match /organizations/{orgId} { allow read: if true; }  // Tutti i nomi organizzazioni
match /events/{eventId} { allow read: if true; }        // Tutti i dettagli eventi
match /{path=**}/lists/{listId} { allow read: if true; }  // Tutte le liste
```

**✅ RISOLTO per `invites`:** Ora usa token come document ID + regole separate per `get` vs `list`.

**Impatto rimanente:**
- Enumerazione di tutte le organizzazioni esistenti
- Scoperta di eventi privati/futuri

**Raccomandazione:**
Limitare la lettura pubblica ai campi strettamente necessari.

---

## 🟡 BUG NOTI (P3)

### 6. Race Condition nella Gestione Sessioni Door — ✅ RISOLTO (15 Giu 2026)

**Fix:** se all'apertura del link door è loggato un account **reale** (non anonimo),
l'app NON crea più silenziosamente la door session sotto quell'UID. Mostra invece una
schermata "Sei già connesso" con scelta esplicita: *Continua come operatore door*
(esegue `signOut` + `signInAnonymously` e riavvia il flusso) oppure aprire in incognito.
Coperto da E2E (`e2e/door-loggedin.spec.ts`). Il caso comune (operatore non loggato)
resta invariato → sessione anonima.

**File:** `components/CheckInPage.tsx`

**Problema (storico):**
```typescript
unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (!userToUse) {
        const credential = await signInAnonymously(auth);
        userToUse = credential.user;
    }
    await initSession(userToUse);
    if (unsubscribe) unsubscribe();  // ⚠️ Unsubscribe dopo prima esecuzione
});
```

Se l'utente è già loggato con un account normale e apre il link door, la sessione door viene creata con l'UID dell'account principale, non anonimo. Questo può:
- Corrompere lo stato dell'utente loggato
- Creare conflitti tra sessione utente e sessione door

---

### 7. Flash di Dati Vecchi al Cambio Utente

**Problema Parzialmente Risolto:** Menzionato nella documentazione come un bug corretto, ma il pattern attuale in `AuthContext.tsx` potrebbe ancora causare:
- Flash di dati dell'organizzazione precedente
- Stato transitorio inconsistente durante il logout

**File:** `contexts/AuthContext.tsx` (linee 103-156)

---

### 8. Gestione Utenti "Pending" Incompleta

**File:** `contexts/AuthContext.tsx` (linee 89-92, 120-124)

**Problema:** Un utente con ruolo `pending` (registrato via invito ma non ha completato):
- Non vede l'OnboardingModal (corretto)
- Ma non ha nessuna UI per completare l'accettazione invito
- Rimane in un limbo senza organizzazione

**Raccomandazione:**
Mostrare un messaggio chiaro agli utenti pending con link per completare l'accettazione.

---

## 📊 Matrice di Sicurezza

| Vettore di Attacco | Stato Attuale | Note |
|--------------------|---------------|------|
| Token brute-force | ✅ Protetto | 24 char + crypto.getRandomValues() |
| Session hijacking | ✅ Protetto | Token validation in rules |
| Spam registrazioni | ⚠️ Parziale | App Check attivo, rate limiting da fare |
| XSS/Injection | ⚠️ Parziale | Validazione input da migliorare |
| **Privilege escalation** | ✅ **PROTETTO** | **v0.12.3: Bloccato update role/organizationId** |
| Data isolation (multi-tenant) | ✅ Protetto | organizationId enforced |

---

## 🛠️ Piano d'Azione Raccomandato

### Fase 1: Fix Critici (1-2 giorni) ✅ COMPLETATA
1. [x] Aumentare lunghezza token a 24+ caratteri ✅ (v0.12.2)
2. [x] Usare `crypto.getRandomValues()` per generazione token ✅ (v0.12.2)
3. [x] Aggiungere verifica token corrente nelle regole door session ✅ (v0.12.2)
4. [x] Implementare invalidazione esplicita sessioni door alla rigenerazione ✅ (v0.12.2) ⚠️ DA VERIFICARE
5. [x] **CRITICO: Bloccare privilege escalation - utenti non possono cambiare il proprio `role` o `organizationId`** ✅ (v0.12.3)

### Fase 2: Hardening (3-5 giorni)
6. [x] Implementare Firebase App Check ✅ (v0.12.1 — site key ora override via
   `VITE_RECAPTCHA_SITE_KEY` con fallback pubblico; **enforcement da abilitare in console**)
7. [~] Rate limiting via Cloud Functions — NON applicabile (vincolo client-only). Rischio residuo documentato + App Check come mitigazione.
8. [x] Migliorare validazione input nelle security rules ✅ (14 Giu 2026)
9. [x] Limitare lettura pubblica (events/organizations: solo get per-ID, niente list) ✅ (14 Giu 2026)

### Fase 3: Monitoring (continuo)
10. [ ] Configurare Firebase Security Rules Monitoring
11. [ ] Implementare logging per operazioni critiche
12. [ ] Setup alerting per comportamenti anomali

---

## 🔍 Codice da Modificare

### File Prioritari:

| File | Modifiche Necessarie |
|------|---------------------|
| `services/firestoreService.ts` | Nuova funzione `generateSecureToken()` |
| `firestore.rules` | Fix door session, validazione input |
| `components/CheckInPage.tsx` | Gestione sessione utente loggato |
| `contexts/AuthContext.tsx` | Gestione stato pending migliorata |

---

## ✅ Punti di Forza Attuali

L'applicazione ha già implementato correttamente:

1. **Multi-tenancy** con isolamento per `organizationId`
2. **Atomic batch operations** per inviti (writeBatch)
3. **Ruoli granulari** (admin, staff, pending)
4. **Security rules strutturate** con helper functions
5. **Protezione dati privati** (private_data subcollection per doorToken)
6. **Gestione scadenza inviti** (7 giorni)
7. **Optimistic UI** con rollback su errore

---

## 📚 Risorse Utili

- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/rules/basics)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

*Documento generato automaticamente durante la review del codice.*
