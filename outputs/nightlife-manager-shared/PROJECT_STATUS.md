# Dioniso - Project Status & Roadmap

**Ultimo aggiornamento:** 17 Dicembre 2024

## 📋 Panoramica del Progetto
**Dioniso** (precedentemente NightLife Manager) è una piattaforma di gestione eventi per discoteche e locali notturni. Attualmente è sviluppata come una Single Page Application (SPA) utilizzando **React**, **TypeScript**, **Vite**, **TailwindCSS** e **Firebase**.

L'applicazione permette di gestire l'intero ciclo di vita di un evento, dalla creazione alla gestione di PR, liste, ospiti e tavoli, con un sistema di autenticazione basato su ruoli.

---

## 🛠 Features Attuali

### 1. 📅 Gestione Eventi (Dashboard Principale)
*   Visualizzazione degli eventi in programma e passati.
*   Creazione di nuovi eventi con dettagli: Nome, Data, Location e Capacità.
*   Interfaccia "Card" con indicatori di stato (Passato/In Programma).
*   Modifica ed eliminazione eventi (con dialog di conferma custom).

### 2. 📊 Dettaglio Evento & Dashboard
*   **Metriche in tempo reale:**
    *   Ospiti totali vs Capacità (con progress bar).
    *   Numero di PR attivi e Liste.
    *   Tavoli occupati.
*   **Grafici:** Istogramma interattivo per visualizzare la ripartizione degli ospiti per Lista PR.

### 3. 👥 Gestione PR e Liste
*   **PR:** Aggiunta ed eliminazione dei PR (disponibile a Admin).
*   **Liste:** Creazione di liste associate a specifici PR.
*   Visualizzazione del conteggio ospiti per ogni lista.
*   **Dialog di conferma custom** per eliminazione con info su elementi correlati.

### 4. 📝 Gestione Ospiti (Guest List)
*   **CRUD Ospiti:** Aggiunta manuale di ospiti con Nome, Lista di appartenenza, Tavolo (opzionale), Note e Telefono.
*   **✨ Aggiunta Multipla:** Inserimento di più ospiti contemporaneamente (uno per riga).
*   **Ricerca e Filtri:** Barra di ricerca per nome e filtro per Lista.
*   **Tabellone:** Visualizzazione chiara con badge per lista e tavolo.
*   **Check-in:** Sistema di check-in per segnare l'arrivo degli ospiti.

### 5. 🛋️ Gestione Tavoli (Privé)
*   **Creazione Tavoli:** Definizione numero/nome, capacità posti e **nominativo prenotazione**.
*   **✨ Nominativo +N Persone:** Visualizzazione in formato "Marco Rossi +9 persone".
*   **Visualizzazione Visuale:** Cards per ogni tavolo che mostrano:
    *   Stato di occupazione (colore ambra/rosso se pieno).
    *   Progress bar di riempimento.
    *   Anteprima dei nomi degli ospiti seduti.

### 6. 🔐 Autenticazione & Ruoli
*   **Login & Registrazione:** Sistema completo via Firebase Auth.
*   **Ruoli Utente:**
    *   **Admin:** Accesso completo a tutte le funzionalità.
    *   **PR:** Accesso limitato (vede solo eventi, liste e ospiti).
    *   **Door:** Accesso per gestione ingressi (check-in) e visualizzazione eventi.

### 7. 🎨 UX & Interfaccia
*   **Dialog di conferma custom:** Modal React personalizzati per tutte le operazioni di eliminazione (sostituisce i dialog nativi instabili).
*   **Dark Theme:** Tema scuro di default con palette viola/slate.
*   **Responsive Design:** Ottimizzato per desktop e mobile.

### 8. 💰 Sistema Prezzi & Entrate
*   **Prezzi Ingresso Liste:** Configurazione prezzo uomo/donna per evento.
*   **Prezzi Tavoli Individuali:** Ogni tavolo ha il proprio prezzo (fisso o a persona).
*   **Auto Prezzo/Persona:** Tavoli con ≥10 ospiti usano automaticamente prezzo a persona.
*   **Flag Genere Ospiti:** Toggle ♂/♀ per ogni ospite, con stato "🍽️ Tavolo" per ospiti anonimi.
*   **Aggiunta Singola con Genere:** Selezione genere nel modal aggiungi ospite.
*   **Aggiunta Multipla M/F:** Due textarea separate per uomini e donne.
*   **Dashboard Entrate Stimate:** 3 card con entrate liste, tavoli e totali.

---

## 🏗️ Architettura Tecnica Attuale
*   **Frontend:** React 19, TypeScript.
*   **Build Tool:** Vite.
*   **Styling:** TailwindCSS (approccio mobile-first, dark theme default).
*   **Icone:** Lucide React.
*   **Grafici:** Recharts.
*   **Backend & Auth:** Firebase (Authentication + Firestore).
*   **Data Persistence:** Firestore (Database NoSQL real-time).
*   **Security:** Firestore Security Rules per protezione dati basata su ruoli.

---

## 📁 Struttura Principale

```
nightlife-manager/
├── App.tsx                    # Main app con auth e eventi
├── components/
│   ├── EventDetail.tsx        # Dettaglio evento (PR, Liste, Ospiti, Tavoli)
│   ├── LoginPage.tsx          # Pagina di login
│   └── RegisterPage.tsx       # Pagina di registrazione
├── contexts/
│   └── AuthContext.tsx        # Context per autenticazione
├── services/
│   ├── firebase.ts            # Configurazione Firebase
│   └── firestoreService.ts    # CRUD operations su Firestore
├── types.ts                   # Interfacce TypeScript
├── firestore.rules            # Regole di sicurezza Firestore
└── firebase.json              # Configurazione Firebase CLI
```

---

## 🚀 Roadmap: Prossime Implementazioni

> [!IMPORTANT]
> **✅ COMPLETATO: Multi-Tenancy + Sistema Inviti Staff**
> Tutti gli step del multi-tenancy (1-10) sono stati completati.
> Vedi **[MULTI_TENANCY_STEPS.md](./MULTI_TENANCY_STEPS.md)** per i dettagli.
> Vedi **[STAFF_INVITE_SYSTEM.md](./STAFF_INVITE_SYSTEM.md)** per la documentazione tecnica del sistema inviti.

Di seguito i prossimi passi per l'evoluzione del prodotto (da riprendere DOPO il completamento del multi-tenancy).

## 📅 Roadmap Implementativa

### ✅ Fase 1: Fondamenta & Dati Locali (v0.1.0 - v0.4.0)
- [x] Setup progetto (React, TS, Vite, Tailwind).
- [x] CRUD Eventi (localStorage).
- [x] Gestione PR, Liste e Tavoli.
- [x] Export CSV ospiti.

### ✅ Fase 2: Check-in & UI Mobile (v0.5.0 - v0.8.0)
- [x] Sistema di Check-in (contatori live, ingresso veloce).
- [x] Ottimizzazione Mobile (liste, tavoli, modali).
- [x] Miglioramenti UX (conferme eliminazione, feedback visivi).

### ✅ Fase 3: Firebase Backend & Auth (v0.9.0 - v0.10.0)
- [x] Migrazione a Firestore (persistenza dati).
- [x] Autenticazione (Login/Register).
- [x] Ruoli Utente (Admin, PR, Door).
- [x] Multi-tenancy (Onboarding, Migrazione dati).

### ✅ Fase 4: Funzionalità Avanzate (v0.11.0+)
- [x] **Impostazioni Organizzazione** (v0.11.0 - Step 9).
- [x] **Sistema Inviti Staff** (v0.11.1 - Step 10).
- [ ] **Gestione Avanzata Tavoli** (Mappa interattiva).
- [ ] **Analisi & Reportistica Avanzata**.

### ✅ Step 0: Sistema Prezzi & Entrate (COMPLETATO)
*   Prezzo ingresso liste configurabile per evento (uomo/donna).
*   Prezzi tavoli individuali con opzione "a persona".
*   Flag genere (♂/♀) per ogni ospite nella guest list.
*   Dashboard con 3 card entrate stimate (liste, tavoli, totale).

### ✅ Step 1: Link Pubblico Liste (COMPLETATO)
*   ✅ **Link Condivisibile:** Ogni lista ha un pulsante 📋 per copiare link pubblico.
*   ✅ **Pagina Registrazione Pubblica:** `/lista/:token` accessibile senza login.
*   ✅ **Form Registrazione:** Nome + Email (per mailing list) + Genere.
*   ✅ **Limiti Automatici:** Registrazioni chiuse 6h prima dell'evento o a capacità esaurita.
*   ✅ **Firestore Rules Aggiornate:** Accesso pubblico per lettura eventi/liste e creazione ospiti.

### 🔹 Step 4: Features Avanzate & UX

*   **Statistiche Finanziarie:** Tracciamento depositi tavoli, costi ingressi e calcolo commissioni PR. #da rivedere, non mi piace
*   **Export:** Esportazione liste in PDF/Excel per la serata.
*   **Email Conferma:** Invio email automatico di conferma registrazione.

### ✅ Step 2: Ottimizzazione Mobile (COMPLETATO)
*   ✅ **Toast Notifications:** Feedback visivo per tutte le azioni (aggiunta, modifica, eliminazione)
*   ✅ **Swipe Check-in:** Scorri a destra sulla riga ospite per check-in rapido
*   ✅ **Tab Navigation Mobile:** Tab con icone, touch target 44px+, scroll orizzontale fluido
*   ✅ **Tabella Responsive:** Colonne nascoste su schermi piccoli per focus su check-in
*   ✅ **Pulsanti Touch-Friendly:** Touch target aumentati, feedback haptic visivo

### ✅ Step 3: Deployment (COMPLETATO)
*   ✅ Firebase Hosting configurato
*   ✅ Build di produzione automatico
*   ✅ Deploy con `npx firebase deploy --only hosting`
*   🌐 **URL Produzione:** https://nightlife-manager-app.web.app


### ✅ Step 5: Mailing List & Orario Chiusura (COMPLETATO)
*   ✅ **Sezione Mailing List:** Dashboard per visualizzare email raccolte dalle registrazioni pubbliche
*   ✅ **Export CSV:** Download email con nome, lista e genere in formato CSV
*   ✅ **Orario Chiusura Personalizzabile:** Configurazione ore prima dell'evento per chiusura registrazioni
*   ✅ **Countdown Dinamico:** Timer in tempo reale nella pagina pubblica con giorni/ore/minuti/secondi
*   ✅ **Chiusura Automatica:** Registrazioni si chiudono automaticamente quando countdown raggiunge zero

### ✅ Step 6: Bug Fixes (COMPLETATO)
*   ✅ **Fix Toast Refresh:** Risolto bug di re-render involontario estraendo componenti interni e memoizzando il contesto.
*   ✅ **Dashboard Jitter:** Risolto bug di aggiornamento immediato delle statistiche durante la modifica dei prezzi separando stato UI e dati persistiti.

### ✅ Step 6.5: Refresh e Fix Dashboard (COMPLETATO)
*   ✅ **Fix Revenue Update:** Le entrate liste ora si aggiornano correttamente dopo il salvataggio dei prezzi (aggiunta dipendenza metrics).
*   ✅ **Refresh Button:** Aggiunto pulsante refresh nella dashboard per aggiornare i dati (nuovi iscritti, ecc.) senza ricaricare la pagina.

### ✅ Step 6.6: Door Check-in System (COMPLETATO)
*   ✅ **Accesso Door Sicuro:** Link univoco con token per accesso staff senza account.
*   ✅ **Nuova Interfaccia Check-in:** UI dedicata `/checkin/:eventId` ottimizzata per velocità e mobile.
*   ✅ **Gestione Token:** Admin può generare e rigenerare i token dalla dashboard.
*   ✅ **Anonimato:** Utilizzo di Firebase Anonymous Auth per sessioni sicure e temporanee.

### ✅ Step 6.7: UI Improvements (COMPLETATO)
*   ✅ **Fix Door Refresh:** Risolto bug pulsante refresh nel Door Check-in (ora ricarica anche le liste e ha feedback visivo).
*   ✅ **Global Refresh:** Spostato pulsante refresh Dashboard nella header dell'evento per renderlo accessibile anche dalla lista ospiti.

### 🔹 Step 6.8: Door Security
*   **se il link operatore door viene rigenerato, operatore door è comunque in grado di effettuare checkin fino a che non refresha la pagina (bug di sicurezza)**
*   **Migliorare desing bottone rigenera token nella dashboard**

### ✅ Step 6.10: Firebase App Check (COMPLETATO)
*   ✅ **App Check Integrato:** Protezione backend da abusi con reCAPTCHA Enterprise.
*   ✅ **Debug Token Locale:** Supporto sviluppo su localhost.
*   ⏳ **Enforcement da abilitare:** Da Firebase Console dopo periodo di monitoring.

### ✅ Step 6.9: Mobile Loading Bug Fix (COMPLETATO)
*   ✅ **Fix Infinite Loading:** Corretto bug che causava caricamento infinito su mobile per link pubblici liste.
*   ✅ **Root Cause:** `getGuests()` richiedeva autenticazione → rimossa chiamata dalla pagina pubblica.
*   ✅ **Error Handling:** Aggiunto `setState('error')` nel catch block per gestire errori correttamente.

### 🔹 Step 7: Personalizzazione Link Pubblico
*   **Background Personalizzato:** Possibilità di aggiunge immagine locandina come sfondo della pagina registrazione pubblica


---

## 🛠 Workflow di Sviluppo

### Sviluppo Locale

```bash
# Avvia server di sviluppo (hot reload)
npm run dev
# → http://localhost:3001
```

### Deploy in Produzione

```bash
# 1. Build per produzione
npm run build

# 2. Deploy su Firebase Hosting
npx firebase deploy --only hosting
# → https://nightlife-manager-app.web.app
```

### Comandi Utili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Server sviluppo con hot reload |
| `npm run build` | Build ottimizzato per produzione |
| `npm run preview` | Preview del build locale |
| `npx firebase deploy --only hosting` | Deploy solo hosting |
| `npx firebase deploy` | Deploy completo (hosting + rules) |
| `npx firebase projects:list` | Lista progetti Firebase |

### Struttura Deploy

```
dist/                    # Output build (generato da Vite)
├── index.html          # Entry point
└── assets/             # JS/CSS bundle
    ├── index-*.js      # Bundle React (~1MB)
    └── index-*.css     # Stili (~2.5KB)
```

---

## 📝 Changelog Recente

### v0.12.3 (17 Dicembre 2024) - Critical Privilege Escalation Fix
- 🔒 **CRITICO: Bloccata Privilege Escalation:** Gli utenti non possono più modificare il proprio `role` o `organizationId` tramite Firestore.
- 🔒 **Security Rules Aggiornate:** `allow update` ora blocca esplicitamente i campi `role` e `organizationId` usando `diff().affectedKeys()`.
- 🔒 **Blocco Delete Profilo:** Gli utenti non possono eliminare il proprio documento profilo (`allow delete: if false`).
- ⚠️ **Vulnerabilità Identificata da Review Esterna:** Un utente malintenzionato avrebbe potuto auto-promuoversi a `admin`.

### v0.12.2 (17 Dicembre 2024) - Security Phase 1 Fixes
- 🔒 **Token Sicuri:** Generazione token con `crypto.getRandomValues()` (24 caratteri, 62^24 combinazioni).
- 🔒 **Invalidazione Door Session:** Le sessioni door vengono invalidate istantaneamente quando si rigenera il token. ⚠️ DA VERIFICARE
- 📋 **Completata Fase 1:** Tutti i fix critici di `SECURITY_ANALYSIS.md` implementati.

### v0.12.1 (17 Dicembre 2024) - Firebase App Check Security
- ✅ **App Check Integrato:** Protezione backend da abusi con reCAPTCHA Enterprise.
- ✅ **Debug Token Locale:** Supporto sviluppo su localhost con token automatico.
- 📋 **Prossimo passo:** Abilitare enforcement da Firebase Console dopo monitoring.

### v0.12.0 (17 Dicembre 2024) - Dioniso Rebrand + Mobile Bug Fixes
- 🎉 **Rebrand:** App rinominata da "NightLife Manager" a "Dioniso".
- ✅ **Fix Input Numerici Mobile:** Campi prezzo/persone ora permettono valore vuoto (no più sticky "0").
- ✅ **Fix Link Pubblico Liste:** Generazione link funziona al primo click.
- ✅ **Fix Responsive Modali:** Data/Ora e Capacità su righe separate in portrait mode.
- ✅ **Fix Collision Header:** Icona CalendarPlus + testo nascosto su mobile per "Crea Evento".
- ✅ **Icone Semplificate:** Rimosso testo "Modifica"/"Elimina" nella header evento (solo icone).

### v0.11.4 (17 Dicembre 2024) - Invite Security Fix
- ✅ **Fix Token Exposure:** Token invito ora usato come document ID (previene attacchi di enumerazione).
- ✅ **Security Rules Migliorate:** Separato `get` (pubblico) da `list` (solo admin) per collezione invites.
- ✅ **Rimosso campo `token`:** Non più salvato come campo queryable in Firestore.
- 📄 **Documentazione:** Creato `SECURITY_ANALYSIS.md` con analisi completa vulnerabilità.

### v0.11.3 (17 Dicembre 2024) - Staff Session Bug Fix
- ✅ **Fix Accettazione Inviti:** Operazione atomica con `writeBatch` per garantire consistenza.
- ✅ **Fix Security Rules:** Corretto controllo `usedBy` che bloccava accettazione inviti.
- ✅ **Protezione Utenti Pending:** Utenti `pending` non vedono OnboardingModal.
- ✅ **Safety Check OnboardingModal:** Verifica se utente ha già organizzazione prima di crearne una nuova.
- ✅ **Vista Utenti Pending:** Messaggio chiaro per chi non ha completato l'accettazione invito.

### v0.11.2 (16 Dicembre 2024) - Mobile Loading Fix
- ✅ **Fix Infinite Loading Mobile:** Corretto bug che causava caricamento infinito su mobile per link pubblici `/lista/:token`.
- ✅ **Rimosso conteggio iscritti:** La chiamata `getGuests()` richiedeva autenticazione, rimossa dalla pagina pubblica.
- ✅ **Error Handling migliorato:** Aggiunto `setState('error')` per gestire errori invece di rimanere in loading.

### v0.11.1 (16 Dicembre 2024) - Staff Invite System
- ✅ **Sistema Inviti Staff:** Admin può generare link per invitare collaboratori.
- ✅ **Pagina Accettazione Invito:** Form login/registrazione inline su `/invite/:token`.
- ✅ **Nuovo Ruolo `staff`:** Stessi privilegi admin tranne modifica organizzazione.
- ✅ **Security Rules Aggiornate:** Lettura pubblica organizations, update semplificato invites.
- ✅ **Ruolo `pending`:** Supporto per registrazione via invito.

### v0.10.1 (15 Dicembre 2024) - Refresh Improvements
- ✅ **Fix Door Refresh:** Pulsante refresh nel check-in ricarica dati e liste con feedback visivo.
- ✅ **Global Refresh:** Pulsante refresh accessibile da tutte le tab (non solo Dashboard).

### v0.10.0 (15 Dicembre 2024) - Door System
- ✅ **Door Check-in System:** Nuovo sistema di check-in tramite link sicuro (token-based).
- ✅ **Anonymous Auth:** Integrazione accesso anonimo per staff door.
- ✅ **Check-in UI:** Nuova interfaccia semplificata per gestione ingressi.
- ✅ **Admin Controls:** Generazione e reset token accesso door.

### v0.9.0 (15 Dicembre 2024) - Bug Fixes
- ✅ **Fix Refresh Toast:** Risolto problema di ricaricamento pagina alla chiusura dei toast (componenti estratti + memoizzazione context)
- ✅ **Fix Dashboard Jitter:** Statistiche dashboard ora stabili durante la modifica dei prezzi (usano valori salvati)
- ✅ **Code Refactoring:** Estratti sottocomponenti `DashboardSection` e `MailingListSection` da `EventDetail`

### v0.6.0 (15 Dicembre 2024)
- ✅ **Toast Notifications:** Sistema di notifiche globale per tutte le azioni CRUD
- ✅ **Swipe Check-in:** Check-in rapido con swipe da sinistra a destra su mobile
- ✅ **Tab Navigation Mobile:** Icone invece di testo su schermi piccoli, touch target 56px
- ✅ **Tabella Ospiti Responsive:** Colonne Genere/Lista/Tavolo nascoste progressivamente
- ✅ **Pulsante Check-in:** Design prominente con sfondo verde e ombre
- ✅ **Hint Mobile:** Banner "Scorri a destra per check-in rapido" su mobile
- ✅ **Haptic Feedback:** Animazione scale al tap sui pulsanti

### v0.8.0 (15 Dicembre 2024)
- ✅ **Sezione Mailing List:** Dashboard per visualizzare email raccolte dalle registrazioni pubbliche
- ✅ **Export CSV:** Download email con nome, lista e genere in formato CSV
- ✅ **Orario Chiusura Personalizzabile:** Configurazione ore prima evento per chiusura registrazioni
- ✅ **Countdown Dinamico:** Timer giorni/ore/minuti/secondi nella pagina pubblica
- ✅ **Chiusura Automatica:** Transizione a stato "chiuso" quando countdown raggiunge zero

### v0.7.0 (15 Dicembre 2024)
- ✅ **Link Pubblico Liste:** Pulsante 📋 copia link per auto-registrazione clienti
- ✅ **Pagina Pubblica:** `/lista/:token` accessibile senza login con form Nome/Email/Genere
- ✅ **Limite Temporale:** Registrazioni chiuse automaticamente 6h prima dell'evento
- ✅ **Limite Capacità:** Form disabilitato quando capacità evento raggiunta
- ✅ **Firestore Rules:** Aggiornate per supportare accesso pubblico controllato
- ✅ **CollectionGroup Index:** Abilitata ricerca token su tutte le liste

### v0.5.0 (15 Dicembre 2024)
- ✅ **Sistema Prezzi Ingresso Liste:** Configurazione prezzo uomo/donna per evento
- ✅ **Prezzi Tavoli Individuali:** Ogni tavolo ha prezzo proprio (fisso o a persona)
- ✅ **Flag Genere Ospiti:** Toggle ♂/♀ per ogni ospite, con stato "🍽️ Tavolo" per anonimi
- ✅ **Dashboard Entrate Stimate:** 3 nuove card (Liste, Tavoli, Totale)
- ✅ **Auto Prezzo/Persona:** Tavoli con ≥10 ospiti usano automaticamente prezzo a persona
- ✅ **Aggiunta Singola con Genere:** Selezione ♂/♀ nel modal aggiungi ospite
- ✅ **Aggiunta Multipla M/F:** Due textarea affiancate (blu uomini, rosa donne)

### v0.4.0 (14 Dicembre 2024)
- ✅ **Tavoli con Lista PR:** Tavoli ora obbligatoriamente collegati a una lista PR
- ✅ **Creazione Automatica Ospiti:** Crea tavolo "Marco Rossi + 5" → genera 6 ospiti automaticamente
- ✅ **Due Modalità Tavoli:** "Nuovo Tavolo" (nome + N persone) e "Tavolo con Nomi" (bulk)
- ✅ **Note Tavoli:** Aggiunto campo note (es. "Privé", "30€ a testa") con modifica
- ✅ **Conteggio Corretto:** Ospiti tavoli contati correttamente in dashboard e liste

### v0.3.0 (14 Dicembre 2024)
- ✅ **Fix Cancellazione:** Implementati dialog di conferma custom React (sostituiti `confirm()` nativi instabili)
- ✅ **Aggiunta Multipla Ospiti:** Nuovo pulsante "Aggiungi Multipli" con textarea per inserire più nomi
- ✅ **Tavoli con Nominativo:** Aggiunto campo "Nominativo Prenotazione" con visualizzazione "+N persone"
- ✅ **Error Handling:** Aggiunto try-catch a tutte le operazioni di cancellazione

### v0.2.0 (14 Dicembre 2024)
- ✅ Integrazione Firebase (Auth + Firestore)
- ✅ Sistema di autenticazione con ruoli (Admin, PR, Door)
- ✅ Firestore Security Rules
