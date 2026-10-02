# Architettura del Progetto NightLife Manager

Questo documento fornisce una panoramica completa dell'architettura tecnica, dello stack tecnologico e dei flussi di dati dell'applicazione **NightLife Manager**.

## 1. Panoramica Tecnologica

Il progetto è una **Single Page Application (SPA)** moderna costruita con:

*   **Frontend Framework:** React 19
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS (approccio utility-first)
*   **Backend / BaaS:** Firebase (Google Cloud)
    *   **Authentication:** Gestione utenti e ruoli
    *   **Firestore:** Database NoSQL in tempo reale
    *   **Hosting:** Deploy statico
*   **State Management:** React Context API
*   **Icons:** Lucide React
*   **Charts:** Recharts

## 2. Struttura dei Dati (Data Model)

Il modello dati principale è definito in `types.ts` e riflette le collezioni Firestore.

### Entità Principali
*   **User (Auth):** Gestito da Firebase Auth (Admin, Staff).
*   **Event:** L'evento principale (data, luogo, capacità).
    *   Campi chiave: `priceListMale`, `priceListFemale`, `listClosingHours`.
*   **PR:** I Public Relations assegnati agli eventi.
*   **GuestList (Lista):** Le liste ospiti, collegate a un PR e un Evento.
    *   Campi chiave: `publicToken` (per link registrazione pubblica).
*   **Guest (Ospite):** Il singolo partecipante.
    *   Campi chiave: `isFemale` (genere), `checkedIn` (stato ingresso), `tableId` (opzionale).
*   **Table (Tavolo):** Gestione privè.
    *   Campi chiave: `capacity`, `primaryGuestName` (capotavola), `pricePerPerson`.

## 3. Architettura Frontend

### Routing e Navigazione
L'applicazione **non utilizza** un router tradizionale (come react-router). La navigazione è gestita tramite state interno (`ViewState`) in `App.tsx`:

*   **Default View:** Dashboard con lista eventi (`EVENTS`).
*   **Detail View:** Dettaglio di un singolo evento (`EVENT_DETAIL`).
*   **Public View:** Routing speciale basato sull'URL (`/lista/:token`) per la registrazione pubblica, gestito dalla funzione `getPublicListToken()` in `App.tsx`.

### State Management
Lo stato è gestito su due livelli:
1.  **Context API (Globale):**
    *   **`AuthContext`**: Gestisce l'utente loggato, il profilo (ruolo) e lo stato di caricamento auth.
    *   **`ToastContext`**: Sistema centralizzato per le notifiche (success/error/info) accessibile ovunque.
2.  **Local State (Componenti):** Gestito con `useState` e `useMemo` per UI locale e dati transitori (es. form inputs).

### Services Layer (`/services`)
L'accesso ai dati è astratto nel layer dei servizi:
*   **`firebase.ts`**: Inizializzazione dell'app Firebase.
*   **`firestoreService.ts`**: Contiene tutta la logica di business e le chiamate al database. Espone metodi tipizzati per CRUD (es. `getEvents`, `saveGuest`, `deleteTable`).
*   **`storage.ts`**: (Legacy) Implementazione basata su `localStorage`. Attualmente non utilizzata in produzione, sostituita da `firestoreService`.

### Component Structure
*   **`App.tsx`**: Entry point. Orchestrator che decide cosa mostrare (Login, Register, Dashboard, o Public Page) basandosi sull'autenticazione e l'URL.
*   **`components/EventDetail.tsx`**: Il "cuore" dell'applicazione. Un componente complesso che gestisce:
    *   Tabs (Dashboard, Liste, Ospiti, Tavoli).
    *   Logica di calcolo statistiche in tempo reale (Revenue, Counts).
    *   Modali per CRUD (Aggiunta Ospiti, Tavoli, Liste).
*   **`components/PublicListPage.tsx`**: Landing page standalone per gli utenti finali che si registrano tramite link pubblico.
*   **`Auth Components`**: `LoginPage`, `RegisterPage`.

## 4. Flussi Chiave

### Autenticazione e Ruoli
1.  L'utente si logga tramite Firebase Auth.
2.  `AuthContext` recupera il documento profilo utente da Firestore per determinare il ruolo (`admin`, `pr`, `door`).
3.  La UI si adatta dinamicamente:
    *   **Admin:** Accesso totale.
    *   **PR:** Vede solo i propri eventi/liste (logica UI parzialmente implementata, backend rules applicate).
    *   **Door:** Vede eventi ma interazione limitata al check-in.

### Gestione Dati e Real-time
Le operazioni di lettura non sono attualmente in real-time (listener) ma on-demand (fetch) per ottimizzare le letture, eccetto per casi specifici se implementati in futuro. Tuttavia, Firestore permette aggiornamenti istantanei se necessario.
*   **Optimistic UI:** Alcune interazioni (come il check-in) aggiornano immediatamente la UI locale per massima reattività, sincronizzando poi con il backend.

### Registrazione Pubblica
1.  Un PR genera un link pubblico (es. `app/lista/xyz123`).
2.  Un utente esterno apre il link.
3.  `App.tsx` rileva il token nell'URL e renderizza `PublicListPage`.
4.  L'utente compila il form -> `firestoreService` crea un ospite nella lista associata.
5.  Le Security Rules permettono la **scrittura pubblica** solo per la collezione ospiti con validazione campi specifici.

### Door Check-in System (v0.10.0)
1.  **Admin:** Genera `doorToken` salvato in `events/{id}/private_data/config` (doc protetto, leggibile solo da Admin).
2.  **Door Staff:** Riceve un link con token (es. `app/checkin/{id}?token={token}`).
3.  **Authentication:** L'app usa `signInAnonymously()` di Firebase Auth.
4.  **Sessione:** `useEffect` chiama `createDoorSession`. Le regole di sicurezza verificano che il token nel payload corrisponda a quello nel doc privato. Se valido, crea/aggiorna un doc in `door_sessions/{uid}`.
5.  **Accesso:** Le regole `firestore.rules` garantiscono accesso in lettura/scrittura agli ospiti dell'evento *se e solo se* l'utente ha una sessione valida attiva per quell'evento.

## 5. Security & Deployment

*   **Security Rules (`firestore.rules`):**
    *   La logica di accesso è enforce-ata lato database.
    *   **Privilege Escalation Protection (v0.12.3):** Gli utenti non possono modificare i propri campi `role` o `organizationId` - questo previene auto-promozione a admin.
    *   Esempio: Solo un Admin può cancellare eventi. Chiunque (anche non auth) può leggere informazioni base della lista se possiede un token valido (per la pagina pubblica).
*   **Deployment:**
    *   Ospitato su **Firebase Hosting**.
    *   Build process: `npm run build` (Vite) -> `dist/` -> `firebase deploy`.

## 6. Directory Structure
```
/
├── components/       # Componenti React (UI + Logic)
├── contexts/         # React Contexts (Stato Globale)
├── services/         # Logica di Backend (Firebase)
├── types.ts          # Definizioni TypeScript condivise
├── App.tsx           # Main Hub & Routing logico
├── main.tsx          # React Entry point
└── firestore.rules   # Regole di sicurezza Database
```

## 7. Multi-Tenancy (v0.11.0)

L'applicazione supporta isolamento dati per **organizzazione** (es. ogni discoteca è un tenant separato).

### Modello Dati
*   **Organization:** Entità root con `id`, `name`, `ownerId`.
*   **organizationId:** Campo presente in `Event`, `PR`, `GuestList`, `Guest`, `Table` e `UserProfile`.

### Flusso
1.  **Onboarding:** Nuovo utente → modal per creare organizzazione → `organizationId` salvato nel profilo.
2.  **Service Layer:** `getEvents(organizationId)` filtra con `.where()`. `saveEvent()` inietta `organizationId`.
3.  **Security Rules:** Helper `getUserOrganizationId()` e `isInOrganization()` enforceano isolamento a livello DB.
4.  **Migrazione:** Funzione `migrateLegacyData()` assegna dati esistenti a una nuova org.

### Compatibilità Door/Public
Le funzionalità pubbliche (registrazione ospiti) e door check-in funzionano preservando la sessione utente loggato grazie a `onAuthStateChanged`.

## 8. Sistema Inviti Staff (v0.11.1+)

L'applicazione permette agli admin di invitare collaboratori (ruolo `staff`) tramite link dedicati.

### Flusso Invito
1. **Admin** genera un invito da OrganizationSettings → crea documento in `/invites` con **token come document ID** (16 caratteri).
2. **Link condiviso:** `app/invite/{token}` - valido per 7 giorni.
3. **Nuovo utente:** Apre link → vede form login/registrazione **inline** → si registra con ruolo `pending`.
4. **Accettazione:** Clicca "Accetta Invito" → `acceptInvite()` aggiorna profilo con `organizationId` e `role: 'staff'`.
5. **Redirect:** Dopo 2 secondi → va alla dashboard dell'organizzazione.

### Security Model (v0.11.4)
- **Token = Document ID:** Il token non è salvato come campo queryable (previene enumerazione).
- **`get` invites:** Pubblico - ma richiede di conoscere il token esatto.
- **`list` invites:** Solo admin dell'organizzazione.
- **Lettura organizations:** Pubblica - necessaria per mostrare nome org nella pagina invito.
- **Update invites:** Solo utenti autenticati, solo se invito non già usato.

### Ruoli
| Ruolo | Descrizione | Permessi |
|-------|-------------|----------|
| `admin` | Proprietario organizzazione | Tutti i permessi |
| `staff` | Collaboratore invitato | Tutto tranne modifica org e creazione inviti |
| `pending` | Utente appena registrato via invito | Nessuno (temporaneo) |

