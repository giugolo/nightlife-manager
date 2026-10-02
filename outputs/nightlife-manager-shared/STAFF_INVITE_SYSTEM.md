# Sistema Inviti Staff - Documentazione Tecnica

Questa documentazione spiega l'implementazione del sistema di inviti per aggiungere membri staff a un'organizzazione in NightLife Manager.

## Panoramica

Il sistema di inviti permette agli admin proprietari di un'organizzazione di invitare nuovi collaboratori (ruolo "staff") tramite link dedicati. Gli staff hanno gli stessi privilegi degli admin eccetto la modifica dell'organizzazione.

---

## Data Model

### Interface `Invite` ([types.ts](./types.ts))

```typescript
export interface Invite {
  id: string;                // Token IS the document ID (security: prevents enumeration)
  organizationId: string;    // ID dell'org a cui appartiene l'invito
  role: 'staff';             // Ruolo assegnato (sempre 'staff')
  createdBy: string;         // UID dell'admin che ha creato l'invito
  createdAt: string;         // ISO timestamp creazione
  expiresAt: string;         // ISO timestamp scadenza (7 giorni)
  usedBy?: string;           // UID di chi ha accettato (se usato)
  usedAt?: string;           // ISO timestamp accettazione
}
```

> **🔒 Security Note (v0.11.4):** Il token non è più salvato come campo separato.
> Il token stesso è usato come document ID, impedendo attacchi di enumerazione
> tramite query `getDocs()` sulla collezione.

### Collezione Firestore: `invites`

Collezione root-level. Accesso controllato:
- `get` (singolo documento): pubblico (necessario per validare link invito)
- `list` (query collezione): solo admin dell'organizzazione

---

## Funzioni Service ([firestoreService.ts](./services/firestoreService.ts))

| Funzione | Parametri | Ritorno | Descrizione |
|----------|-----------|---------|-------------|
| `generateInviteToken()` | - | `string` | Genera token 16 caratteri alfanumerici |
| `createInvite(orgId, createdBy)` | `string, string` | `Promise<Invite>` | Crea invito con scadenza 7 giorni |
| `getInviteByToken(token)` | `string` | `Promise<Invite \| null>` | Recupera invito da token |
| `acceptInvite(inviteId, userId)` | `string, string` | `Promise<void>` | Accetta invito e aggiorna user |
| `getOrganizationInvites(orgId)` | `string` | `Promise<Invite[]>` | Lista tutti gli inviti dell'org |
| `deleteInvite(inviteId)` | `string` | `Promise<void>` | Elimina invito pendente |

### Flow Creazione Invito

```
Admin → createInvite(orgId, uid) → {
  1. Genera token 16 caratteri
  2. Calcola expiresAt (now + 7 giorni)
  3. Salva documento in /invites con id = inv_[token.slice(0,8)]
  4. Ritorna oggetto Invite
}
```

### Flow Accettazione Invito

```
Staff → acceptInvite(inviteId, userId) → {
  1. Verifica invito esiste
  2. Verifica non già usato (usedBy undefined)
  3. Verifica non scaduto (expiresAt > now)
  4. Aggiorna /users/{userId} con:
     - organizationId: invite.organizationId
     - role: 'staff'
  5. Marca invito come usato:
     - usedBy: userId
     - usedAt: now
}
```

---

## Security Rules ([firestore.rules](./firestore.rules))

### Helper Functions

```javascript
function isStaff() {
  return isAuthenticated() && getUserRole() == 'staff';
}

function isAdminOrStaff() {
  return isAdmin() || isStaff();
}
```

### Regole Collezione `invites`

```javascript
match /invites/{inviteId} {
  // Lettura pubblica (serve per validazione token nella pagina accettazione)
  allow read: if true;
  
  // Solo admin dell'organizzazione può creare inviti
  allow create: if isAdmin() && 
                  request.resource.data.organizationId == getUserOrganizationId();
  
  // Solo admin può eliminare
  allow delete: if isAdmin() && 
                  resource.data.organizationId == getUserOrganizationId();
  
  // Update solo per marcare come usato (qualsiasi utente autenticato, invito non già usato)
  // Usa .get() per gestire campo usedBy mancante o null
  allow update: if isAuthenticated() && resource.data.get('usedBy', null) == null;
}
```

### Regole Collezione `organizations`

```javascript
match /organizations/{orgId} {
  // Lettura pubblica (serve per mostrare nome org nella pagina accettazione invito)
  allow read: if true;
  // Solo utenti autenticati possono creare (durante onboarding)
  allow create: if isAuthenticated() && request.resource.data.ownerId == request.auth.uid;
  // Solo owner può modificare/eliminare
  allow update, delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
}
```

---

## Componenti UI

### `InviteModal.tsx`

Modal per generare link invito. Usato in OrganizationSettings.

**Props:**
```typescript
interface InviteModalProps {
    organizationId: string;
    userId: string;           // UID dell'admin che crea
    onClose: () => void;
    onInviteCreated: (invite: Invite) => void;
}
```

**Flusso:**
1. Mostra pulsante "Genera Link Invito"
2. Click → chiama `createInvite()`
3. Successo → mostra link con pulsante copia
4. Mostra data scadenza

### `InviteAcceptPage.tsx`

Pagina standalone per accettare inviti. Route: `/invite/:token`

**Props:**
```typescript
interface InviteAcceptPageProps {
    token: string;
    onBack: () => void;
}
```

**Caratteristiche:**
- Form login/registrazione **inline** (non redirect a pagina separata)
- Protezione contro doppie esecuzioni (React Strict Mode)
- Auto-rilevamento inviti già accettati
- Registrazione con ruolo `pending` → convertito a `staff` all'accettazione

**Stati gestiti:**
- Loading (caricamento invito)
- Errore (invito non trovato/scaduto/già usato)
- Non autenticato (form login/registrazione inline)
- Pronto (mostra dettagli org + pulsante accetta)
- Successo (redirect a home dopo 2 secondi)

---

## Routing ([App.tsx](./App.tsx))

```typescript
// Funzione di detection
const getInviteToken = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/invite\/([a-zA-Z0-9]+)$/i);
  return match ? match[1] : null;
};

// Nel componente AppContent
if (inviteToken) {
  return <InviteAcceptPage token={inviteToken} onBack={() => window.location.href = '/'} />;
}
```

---

## Sistema Ruoli

### Prima (v0.10.0)
- `admin` - Accesso completo
- `pr` - Gestione liste (sostituito da link pubblici)
- `door` - Check-in (sostituito da door token)

### Dopo (v0.11.0)
- `admin` - Proprietario organizzazione, tutti i permessi
- `staff` - Collaboratore invitato, stessi permessi admin TRANNE:
  - Modificare nome/logo organizzazione
  - Creare inviti staff

---

## Testing

### Test Creazione Invito
1. Login come admin proprietario organizzazione
2. Vai in Impostazioni Organizzazione
3. Clicca "Invita Staff"
4. Verifica che il link viene generato
5. Verifica che appare nella lista inviti

### Test Accettazione Invito
1. Copia link invito
2. Apri in browser incognito
3. Registra nuovo account
4. Verifica che vieni aggiunto all'organizzazione come staff
5. Verifica che nella dashboard puoi vedere gli eventi

### Test Scadenza
1. Crea invito
2. Modifica `expiresAt` nel database a data passata
3. Prova ad accettare → deve mostrare "Invito scaduto"

### Test Link Già Usato
1. Accetta un invito con un account
2. Prova ad usare lo stesso link con altro account
3. Deve mostrare "Invito già utilizzato"

---

## Deploy

Dopo modifiche alle security rules:
```bash
npx firebase deploy --only firestore:rules
```

Dopo modifiche al codice:
```bash
npm run build && npx firebase deploy --only hosting
```
