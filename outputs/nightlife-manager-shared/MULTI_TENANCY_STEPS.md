# Multi-Tenancy Implementation - Step by Step

> ⚠️ **Prima di ogni step**: Committa le modifiche con `git add . && git commit -m "Checkpoint: Step X"`
> 
> 🔄 **Rollback**: Se qualcosa va storto → `git checkout .` o `git reset --hard HEAD~1`

---

## Step 1: Data Models ✅
**File modificati:** `types.ts`  
**Testabile:** ✅ L'app funziona esattamente come prima (campo non usato ancora)

### Cosa fare:
- [x] Aggiungere interface `Organization`
- [x] Aggiungere `organizationId?: string` a Event, PR, GuestList, Guest, Table
- [x] Aggiungere `organizationId?: string` a UserProfile

### Verifica Step 1:
```bash
npm run dev  # L'app deve funzionare normalmente ✅
```

---

## Step 2: AuthContext - Organization State ✅
**File modificati:** `contexts/AuthContext.tsx`  
**Testabile:** ✅ App funziona normalmente (org sempre null per ora)

### Cosa fare:
- [x] Aggiungere state `organization: Organization | null`
- [x] Aggiungere state `needsOnboarding: boolean`
- [x] Esporre nel context (senza logica per ora)

### Verifica Step 2:
```bash
npm run dev  # Login/Logout funzionano, dashboard visibile ✅
```

---

## Step 3: Organization Service Functions ✅
**File modificati:** `services/firestoreService.ts`  
**Testabile:** ✅ Nuove funzioni non chiamate, app invariata

### Cosa fare:
- [x] Aggiungere `createOrganization(org)`
- [x] Aggiungere `getOrganization(orgId)`
- [x] Aggiungere `updateUserOrganization(userId, orgId)`

### Verifica Step 3:
```bash
npm run dev  # App funziona normalmente ✅
npm run build  # Build successful ✅
```

---

## Step 4: Onboarding UI ✅
**File modificati:** `App.tsx`, nuovo `components/OnboardingModal.tsx`, `firestore.rules`  
**Testabile:** ✅ Se l'utente non ha org → mostra modal

### Cosa fare:
- [x] Creare `OnboardingModal.tsx` - form semplice con nome org
- [x] In `App.tsx`: se `userProfile && !userProfile.organizationId` → mostra modal
- [x] Al submit: crea org, aggiorna user profile, refresh context
- [x] Aggiungere security rules per collection `organizations`

### Verifica Step 4:
```bash
npm run dev
# 1. Login come utente esistente → Vedi modal onboarding ✅
# 2. Crea org "Test Org"
# 3. Ricarica pagina → NON vedi più modal, vai alla dashboard
```

---

## Step 5: Migrazione Dati Esistenti ✅
**File modificati:** `services/firestoreService.ts`, `components/OnboardingModal.tsx`  
**Testabile:** ✅ Utente specifico vede i suoi dati dopo migrazione

### Cosa fare:
- [x] Creare funzione `migrateLegacyData(organizationId)`
- [x] Nel flusso onboarding: dopo creazione org, migrare tutti i dati
- [x] **IMPORTANTE**: Solo l'utente `edoardougolotti@protonmail.ch` avrà i dati pre-esistenti

### Verifica Step 5:
```bash
npm run dev
# 1. Login come edoardougolotti@protonmail.ch
# 2. Crea org → I dati esistenti devono rimanere visibili
# 3. Login come NUOVO utente → Dashboard vuota
```

---

## Step 6: Service Layer Filtering ✅
**File modificati:** `services/firestoreService.ts`, `App.tsx`  
**Testabile:** ✅ App mostra solo dati dell'org corrente

### Cosa fare:
- [x] Modificare `getEvents(organizationId)` - aggiungere filtro `.where()`
- [x] Modificare `saveEvent` - iniettare `organizationId`
- [x] Aggiornare chiamate in `App.tsx` per passare `organization?.id`

### Verifica Step 6:
```bash
npm run dev
# 1. Login come user Org A → Vedi eventi Org A ✅
# 2. Login come user Org B → Vedi eventi Org B (o vuoto) ✅
# 3. Crea evento → Ha organizationId corretto in Firestore ✅
```

---

## Step 7: Security Rules Enforcement ✅
**File modificati:** `firestore.rules`  
**Testabile:** ✅ Impossibile accedere a dati di altre org

### Cosa fare:
- [x] Aggiungere helper `getUserOrganizationId()` e `isInOrganization()`
- [x] Applicare check a events, prs, lists, guests, tables
- [x] Preservare accesso pubblico per registrazione ospiti
- [x] Preservare accesso door session per check-in

### Verifica Step 7:
```bash
npm run build && npx firebase deploy --only firestore:rules

# Test in browser console (F12):
# firebase.firestore().collection('events').get()  # Deve tornare solo eventi propri
```

---

## Riepilogo Checkpoint

| Step | Rischio | Rollback Facile | Test |
|------|---------|-----------------|------|
| 1 | ⬜ Nullo | ✅ Sì | App funziona |
| 2 | ⬜ Nullo | ✅ Sì | App funziona |
| 3 | ⬜ Nullo | ✅ Sì | App funziona |
| 4 | 🟨 Basso | ✅ Sì | Modal appare |
| 5 | 🟧 Medio | ✅ Sì (dati in Firestore) | Dati migrati |
| 6 | 🟧 Medio | ⚠️ Richiede attenzione | Filtro funziona ✅ |
| 7 | 🟥 Alto | ⚠️ Deploy rules | Isolamento completo ✅ |

---

## Comandi Utili

```bash
# Salvare stato prima di ogni step
git add . && git commit -m "Checkpoint: Prima di Step X"

# Rollback ultimo step
git reset --hard HEAD~1

# Vedere stato modifiche
git status
git diff

# Deploy solo rules (Step 7)
npm run build && npx firebase deploy --only firestore:rules
```

---

## 🔮 Prossimi Step

### Step 8: Modal Onboarding Migliorato 🎨 ✅
**File modificati:** `components/OnboardingModal.tsx`

- [x] Aggiungere campo logo/immagine organizzazione (upload o URL)
- [x] Preview dell'organizzazione prima di confermare
- [x] Validazione nome organizzazione (min 3 caratteri)
- [x] Animazioni di transizione migliorate

---

### Step 9: Panoramica Organizzazione (Admin) 📊 ✅
**File modificati:** `App.tsx`, nuovo `components/OrganizationSettings.tsx`, `services/firestoreService.ts`

- [x] Sezione "Organizzazione" nel header o menu
- [x] Visualizzazione dettagli org (nome, logo, data creazione)
- [x] Modifica nome/logo organizzazione
- [x] Statistiche aggregate (tot eventi, tot ospiti, tot PR)
- [x] Lista utenti dell'organizzazione con ruoli

---

### Step 10: Sistema Inviti Staff 📨 ✅ (Completato 16 Dicembre 2024)
**File modificati:** `types.ts`, `AuthContext.tsx`, `RegisterPage.tsx`, `firestoreService.ts`, `firestore.rules`, `App.tsx`, `OrganizationSettings.tsx`  
**Nuovi file:** `components/InviteModal.tsx`, `components/InviteAcceptPage.tsx`

- [x] Semplificato sistema ruoli: `admin`/`pr`/`door` → `admin`/`staff`
- [x] Rimossa selezione ruolo dalla registrazione (tutti i nuovi utenti sono admin)
- [x] Admin può generare link invito per nuovi staff
- [x] Collezione `invites` con token, orgId, ruolo, scadenza (7 giorni)
- [x] Pagina `/invite/:token` per accettare invito con form login/registrazione inline
- [x] Nuovo staff registrato viene automaticamente associato all'org
- [x] Lista inviti pendenti/usati nella sezione Organizzazione
- [x] Staff ha stessi privilegi admin TRANNE modificare l'organizzazione
- [x] Ruolo `pending` per utenti registrati via invito
- [x] Security rules: lettura pubblica organizations, update semplificato invites

---

## 🎉 Multi-Tenancy Completato!

Tutti gli step (1-10) sono stati implementati con successo. Il sistema supporta ora:
- Isolamento completo dei dati per organizzazione
- Onboarding automatico per nuovi admin
- Sistema di inviti per aggiungere staff
- Ruoli differenziati (admin/staff)
- Security rules robuste

Per la documentazione tecnica del sistema inviti, vedi [STAFF_INVITE_SYSTEM.md](./STAFF_INVITE_SYSTEM.md).
