# Dioniso — piano totale di rework

**Parti dalla fase 1. Il primo traguardo è rendere affidabili accessi, liste e ingresso; la rifinitura visiva segue una base verificata.**

Data: 2 ottobre 2026. Progetto analizzato: `/Users/edoardo/Desktop/playground/nightlife-manager`. Revisione: `6a702ad`, versione applicazione `0.13.0`. Working tree originale pulito all'inizio dell'audit.

**Stato:** audit verificato e proposta di rework completa da revisionare. Questo documento è una roadmap di prodotto e tecnica, non una specifica già approvata. Ogni fase diventerà una specifica e un piano di implementazione separati prima dell'esecuzione, seguendo Superpowers. Nessuna modifica al prodotto originale, pubblicazione o accesso ai dati di produzione è stata effettuata.

## 1. Obiettivo e perimetro

L'obiettivo scelto dall'utente è **usarlo davvero per gestire locali e serate**. Il prodotto deve aiutare un responsabile a preparare una serata, condividere le liste, coordinare gli operatori all'ingresso e ottenere un consuntivo comprensibile.

Scenario di progetto proposto per dimensionare i test: un'organizzazione, uno o più locali rappresentati inizialmente dal luogo dell'evento, fino a 2.000 nominativi per evento e tre operatori all'ingresso. È un'ipotesi di lavoro da verificare con il primo pilot, non una misura dell'uso attuale. Nessuna introduzione di abbonamenti, billing SaaS o portale multi-organizzazione in questo rework.

### Cinque criteri di successo

1. Un responsabile crea una serata e condivide la prima lista in meno di 3 minuti dopo l'onboarding.
2. Un operatore trova un ospite e richiede l'ingresso in meno di 5 secondi; la ricerca locale risponde entro 200 ms con 2.000 nominativi nel dispositivo di prova.
3. Due operatori non possono registrare due ingressi per la stessa persona; un'azione fallita non appare come confermata.
4. Un utente esterno all'organizzazione non può leggere gli ospiti o attribuirsi privilegi; link revocati e inviti scaduti vengono rifiutati lato server.
5. Una serata si chiude con conteggi verificabili, esportazioni utilizzabili e una procedura provata di recupero dei dati.

I tempi sono obiettivi di accettazione da misurare nel pilot. Il tempo di conferma dal server dipende dalla rete: va misurato separatamente dal feedback immediato dell'interfaccia.

## 2. Stato reale del progetto

React, TypeScript, Vite, Tailwind e Firebase sono una base adeguata al perimetro. Esistono organizzazioni, liste con link pubblico, staff, inviti, tavoli e ingresso anonimo tramite token. Ci sono primitive UI, logica delle metriche estratta e CI con test e build.

Le ultime modifiche hanno già introdotto React Router e diviso il dettaglio evento in `EventHome`, `GuestsTab`, `TablesTab` e `useEventData`. `EventDetail.tsx` ha 325 righe, non oltre 2.000 come afferma una vecchia analisi. La navigazione interna degli eventi usa però ancora stato React, quindi evento, tab e filtri non hanno URL propri.

README e documenti storici sono stati trattati come contesto da verificare. Alcune descrizioni di routing, ruoli, dipendenze e validazioni non corrispondono al codice attuale. Il piano non ripete refactoring già fatti.

### Baseline eseguita

| Verifica | Risultato osservato | Limite della verifica |
|---|---|---|
| `npm run test -- --run` | 5 file, 30 test passati | 10 test di chiusura liste duplicano la logica; lo smoke test non importa il prodotto |
| E2E esistenti | 6 test passati | Il test multi-tenant guarda il dashboard; non prova letture dirette degli ospiti di un altro tenant |
| `tsc --noEmit` | Exit 0 | `strict` non è abilitato |
| `npm run lint` | Exit 0, 15 warning | Include dipendenze degli effect e utilizzi di `any` |
| `npm run build` | Exit 0; JS 910,50 KB / 232,99 KB gzip | Un solo chunk JS iniziale; avviso Vite oltre 500 KB |

Test eseguiti con dipendenze locali già presenti e Node 26.3.0. La CI dichiara Node 20: la riproducibilità con installazione pulita e runtime CI resta una verifica da fare. Non ho installato o aggiornato pacchetti.

Gli E2E sono stati eseguiti in una copia con progetto `demo-nightlife-audit`, traffico browser esterno bloccato e porte dedicate. Le variazioni di progetto e porte riguardano solo l'infrastruttura di audit; le regole Firestore sono quelle del repository. Un emulatore Firestore residuo causava il riuso di un backend senza Auth: il problema è stato isolato e la suite rieseguita con avvio completo. Il launcher futuro deve verificare tutti i servizi necessari.

### Sicurezza: comportamenti riprodotti sugli emulatori

Questi sono risultati di richieste dirette ai servizi locali, non deduzioni basate solo sulla UI. Il JSON dei risultati è in [AUDIT-EVIDENCE.json](AUDIT-EVIDENCE.json). Non attestano quali regole siano effettivamente pubblicate in produzione, né un accesso avvenuto a dati reali.

| Caso | Risultato attuale | Origine nel repository |
|---|---|---|
| Admin B legge gli ospiti dell'evento A | Consentito | `firestore.rules:234–237`: il ramo `isAdminOrStaff()` non controlla il tenant |
| Admin B legge i PR dell'evento A | Consentito | `firestore.rules:204–206`: stesso controllo troppo ampio |
| Visitatore enumera liste e relativi token | Consentito | `firestore.rules:168–169` e `223`: lettura pubblica generalizzata |
| Visitatore crea ospite per evento passato, lista inesistente e `checkedIn: true` | Consentito | `firestore.rules:243–253`: validazione dei campi senza vincoli del flusso |
| Nuovo utente crea il proprio profilo admin in un'organizzazione esistente | Consentito | `firestore.rules:90`: creazione del proprio profilo senza controllo su ruolo e org |

| Caso | Risultato attuale | Origine nel repository |
|---|---|---|
| Utente pending diventa staff di un'organizzazione senza invito | Consentito | `firestore.rules:102–112`: prima assegnazione org e transizione di ruolo non legate a un invito |
| Door modifica nome ed email di un ospite | Consentito | `firestore.rules:257–261`: sessione valida concede update senza allowlist dei campi |
| Door scrive una sessione associata a un altro UID | Consentito con token valido | `firestore.rules:158–164`: manca il confronto con l'UID nel percorso |
| Utente riscrive ruolo e org di un invito inutilizzato e scaduto | Consentito | `firestore.rules:152`: update non limita campi, destinatario o scadenza |
| Admin A cambia `organizationId` dell'evento | Consentito | `firestore.rules:189–190`: controllo sul documento precedente, non sull'immutabilità del tenant |

**Conseguenza:** il filtro del dashboard non dimostra isolamento dei dati. L'enforcement App Check in produzione non è stato consultato e non sostituisce il controllo dei permessi. La semantica delle regole sovrapposte è documentata da [Firebase](https://firebase.google.com/docs/firestore/security/rules-structure): basta una condizione permissiva applicabile per concedere l'accesso.

### Integrità e operatività: problemi osservati nel codice

| Area | Evidenza | Conseguenza per una serata |
|---|---|---|
| Ingresso | `CheckInPage.tsx:172` e `GuestsTab.tsx:118` alternano un valore letto dal client; `saveGuest` riscrive l'intero ospite | Due dispositivi lavorano su dati obsoleti e possono sovrascrivere campi; manca un comando idempotente |
| Sincronizzazione | `useEventData.ts:31` usa `getDocs` e un loading globale; door ricarica manualmente | Gli aggiornamenti di un operatore non arrivano automaticamente agli altri; refresh può smontare form e filtri |
| Tavoli e import | `TablesTab.tsx:46` salva tavolo e ospiti con scritture separate; crea ospiti fittizi e cambia automaticamente tariffa a 10 persone | Errori intermedi lasciano gruppi incompleti; conteggi e prezzi incorporano decisioni implicite |
| Export | `MailingListSection.tsx:26` usa una sequenza letterale `\\n`; campi uniti con virgole senza escaping | CSV non strutturato correttamente; nomi con virgole o formule producono risultati errati o pericolosi negli spreadsheet |
| Ciclo di vita | `deleteEvent` raccoglie tutto in un batch e omette `private_data`; migrazione legacy parte dall'onboarding | Cancellazioni grandi e dati residui richiedono gestione esplicita; la migrazione non è un'operazione ordinaria del nuovo utente |

Sono rischi e difetti individuati tramite lettura del codice; concorrenza, cancellazioni su volumi elevati e guasti intermedi non sono stati stressati in questo audit. Vanno riprodotti prima delle relative correzioni.

Ulteriori punti incorporati nel piano: date senza fuso (`datetime-local` salvato come stringa), `organizationId` opzionale nei tipi, errori di fetch spesso solo in console, email di conferma browser-side senza stato di consegna, assenza di separazione tecnica tra email d'iscrizione e consenso marketing. La configurazione Firebase è hardcoded mentre il README descrive variabili d'ambiente; le chiavi pubbliche del client non sono considerate password, ma la selezione esplicita dell'ambiente serve a evitare collegamenti involontari alla produzione.

## 3. Direzione del rework

### Tre approcci valutati

| Approccio | Beneficio | Costo e limite |
|---|---|---|
| **Rework progressivo su React + Firebase — raccomandato** | Conserva funzionalità e conoscenza; migliora i flussi con rilasci verificabili | Richiede migrazione e compatibilità temporanea dei dati |
| Restyling più patch locali | Riduce il tempo per avere schermate più curate | Lascia irrisolte operazioni affidate al client, concorrenza e recupero |
| Riscrittura completa e cambio backend | Permette un nuovo modello senza compatibilità interna | Riporta a zero molti flussi funzionanti; va giustificata da requisiti oggi assenti |

Il rework progressivo offre il miglior rapporto tra qualità e rischio per l'uso operativo scelto. Non emerge un motivo sufficiente per introdurre Next.js, un backend SQL o un'app nativa prima del pilot.

### Identità e design

Proposta: una console operativa sobria, riconoscibile come Dioniso. Mantenere il blu delle azioni, superfici scure con gerarchia chiara, verde per operazioni confermate e ambra per attenzione. Tipografia leggibile, numeri allineati, spaziature coerenti. Un solo sistema di componenti per app, registrazione pubblica e inviti; landing allineata dopo i flussi operativi.

La qualità visiva deriva dalla scelta di cosa mettere in primo piano. Desktop con navigazione stabile e contenuto denso; mobile con azione principale raggiungibile, etichette visibili e stato di connessione. L'attuale schermata a 390 px non ha overflow orizzontale nel caso ispezionato, ma nasconde le etichette delle tab e dedica molto spazio alle quattro card prima delle azioni. Questi sono interventi di gerarchia e usabilità, non una diagnosi generale di responsive rotto.

### Tre momenti della serata

| Momento | Schermata principale | Azione prioritaria |
|---|---|---|
| Preparazione | Evento: checklist di prontezza, liste, tariffe, tavoli, operatori | Condividere una lista valida o completare ciò che manca |
| Ingresso | Door: ricerca, stato ospite, lista/tavolo, connessione | Confermare l'ingresso, vedere un duplicato, gestire un errore |
| Chiusura | Consuntivo: iscritti, ingressi, prenotazioni, importi registrati | Verificare i numeri, esportare, archiviare |

Il contatore check-in rappresenta ingressi registrati cumulativi. Non verrà chiamato “persone dentro” finché non esiste un flusso affidabile di uscita.

## 4. Architettura proposta

### Confini delle responsabilità

1. **Dominio:** regole pure di date, tariffe, prenotazioni e metriche, senza React o Firebase.
2. **Dati:** repository e listener Firestore tipizzati; lifecycle, errori e cleanup centralizzati.
3. **Comandi server:** azioni che richiedono autorità, transazioni o limiti, attraverso Cloud Functions callable.
4. **Interfaccia:** schermate e componenti con form, validazione visibile, stati di rete e permessi comprensibili.
5. **Operazioni:** emulatori, CI, migrazioni, rilascio, log e recupero.

I server SDK bypassano le Security Rules: ogni funzione deve verificare identità, organizzazione e permessi. I token Auth/App Check possono essere trasmessi dalle callable, ma la validazione business rimane responsabilità del server. Riferimenti: [callable Firebase](https://firebase.google.com/docs/functions/callable), [enforcement App Check](https://firebase.google.com/docs/app-check/cloud-functions).

### Organizzazione dei file

La struttura finale proposta può essere introdotta per feature, senza spostare tutto in una PR:

```text
src/
  app/                  router, provider, shell e boundary
  features/
    auth/               login, onboarding, inviti, profili
    events/             elenco, preparazione, dettaglio, archivio
    lists/              liste, condivisione, registrazione pubblica
    door/               ingresso e sincronizzazione operatori
    tables/             tavoli e prenotazioni
    reports/            metriche ed esportazioni
  domain/               tipi, date, denaro e regole pure
  infrastructure/       Firebase, repository, listener e callable client
  shared/ui/            componenti accessibili e token visivi
functions/src/          autorizzazioni e comandi server per feature
tests/rules/            test positivi e negativi delle Security Rules
e2e/                    flussi operativi, multiutente e mobile
scripts/                migrazioni, verifica dati e strumenti di rilascio
```

Nessuna aggiunta automatica di una libreria di stato o caching. Firestore listener per i dati live e stato React per UI/form sono sufficienti all'inizio. Valutare una libreria ulteriore solo se elimina duplicazione concreta; evitare due cache concorrenti sugli stessi dati.

### Contratti critici da fissare nelle specifiche

| Comando | Input essenziale | Risultato e invarianti |
|---|---|---|
| `createOrganization` / `acceptInvite` | Nome org / token invito; identità dalla sessione | Owner e appartenenza assegnati atomicamente; invito non scaduto e consumato una volta |
| `getPublicList` / `registerGuest` | Token opaco; dati iscrizione; `requestId` | Solo informazioni pubblicabili; lista aperta, deadline e limite verificati dal server; retry restituisce la stessa iscrizione |
| `createDoorSession` / `setGuestCheckIn` | Token door / evento, ospite, stato desiderato, `requestId` | Sessione legata al chiamante; aggiornamento atomico; timestamp server; niente toggle su stato obsoleto |
| `createTableReservation` / `importGuests` | Tavolo, persone attese/nominativi / righe validate, `requestId` | Capienza e relazioni valide; duplicati espliciti; operazione completata o esito parziale dichiarato |
| `archiveEvent` / `deleteEvent` | Evento; identità; richiesta confermata | Archivio ordinario; cancellazione server riprendibile, autorizzata, con pulizia di token e sottocollezioni |

Errori di dominio stabili: `LIST_CLOSED`, `CAPACITY_REACHED`, `INVITE_EXPIRED`, `INVITE_USED`, `FORBIDDEN`, `SESSION_REVOKED`, `VALIDATION_FAILED`. Errori di rete restano distinti: non convertirli in “lista inesistente” o “nessun ospite”.

`setGuestCheckIn` riceve uno stato desiderato, non “inverti”. Due richieste contemporanee per il primo ingresso producono un solo nuovo ingresso; la seconda ottiene un esito “già entrato” con lo stato confermato. L'annullamento richiede un permesso esplicito e una voce di audit.

### Dati: decisioni proposte

1. Eventi con `organizationId` obbligatorio, `schemaVersion`, `startsAt` e `registrationClosesAt` come timestamp, `timezone: Europe/Rome`, stato `draft | published | closed | archived`. Conservare campo legacy durante migrazione; verificare il fuso storico prima della conversione.
2. Ruoli iniziali `admin`, `staff`, `pending` conservati. Solo il backend assegna ruolo e organizzazione; `ownerId` non modificabile dal client. Door resta una sessione evento con scadenza e revoca, senza introdurre nuovi account PR nel pilot.
3. Liste private ai membri e alla sessione door autorizzata; risoluzione pubblica per token tramite endpoint con risposta minima. I token grezzi non compaiono in log, analytics o export. Nuovi token possono essere indicizzati tramite digest; compatibilità dei link esistenti gestita da una migrazione esplicita.
4. Tavolo e prenotazione distinti: capienza disponibile, persone prenotate e persone effettivamente entrate sono tre valori. Un gruppo senza nominativi completi usa posti attesi, non ospiti fittizi che gonfiano conteggi. Il prezzo per persona non cambia automaticamente al decimo ospite.
5. Importi in centesimi; tariffa attribuita all'iscrizione/prenotazione. Tariffe Uomo/Donna preservate se necessarie al locale, ma la logica usa una categoria tariffaria esplicita. Le stime restano stime; “incassato” deriva solo da importi realmente registrati. Consenso marketing separato dai dati necessari all'iscrizione.

Per door proporre una proiezione degli ospiti con nome, lista, tavolo e stato ingresso, senza email/telefono/note non necessarie. Aggiornare la proiezione insieme allo stato autorevole o con un meccanismo di riconciliazione testato. Nessuna lettura indiscriminata di contatti dal link ingresso.

## 5. Roadmap: cinque fasi con criteri di uscita

Le stime includono implementazione e verifiche per un implementatore esperto dello stack. Il calendario dipende dal lavoro disponibile e dalle serate. Le fasi sono sequenziali per dipendenze; un singolo task viene portato a risultato prima di iniziarne un altro.

### Fase 1 — chiudere gli accessi indebiti (48–72 ore)

**Risultato:** accessi e link hanno un'autorità verificabile; i 10 comportamenti dell'audit vengono negati mantenendo i flussi leciti.

| Task | Intervento concreto | File iniziali e verifica |
|---|---|---|
| 1.1 Baseline e matrice permessi | Confrontare regole pubblicate e repository tramite accesso autorizzato; introdurre test Security Rules per ruoli, tenant e letture dirette | `firestore.rules`, `tests/rules/access.test.ts`, `playwright.config.ts`; stessi casi audit ora devono fallire con permission denied |
| 1.2 Profili, organizzazioni, inviti | Creazione org e accettazione invito in transazione server; rifiutare escalation, join arbitrario, scadenza e mutazione invito | `contexts/AuthContext.tsx`, `services/firestoreService.ts`, nuove `functions/src/auth/`; test di doppia accettazione e utente già membro |
| 1.3 Registrazione pubblica | Endpoint risoluzione token/iscrizione; negare enumerate liste e scritture pubbliche dirette; deadline server, whitelist campi, relazione lista-evento, limite e idempotenza | `PublicListPage.tsx`, `firestore.rules`, nuove `functions/src/lists/`; test token revocato, lista falsa, checkedIn forgiato, retry e capienza concorrente |
| 1.4 Sessioni e privilegi | UID nel percorso, scadenza sessione, revoca corrente, allowlist di update temporanea; tenant/event owner immutabili; revoca staff | `CheckInPage.tsx`, `OrganizationSettings.tsx`, `firestore.rules`, nuove `functions/src/door/`; door non cambia identità o sessione altrui; staff revocato perde accesso |
| 1.5 Protezione del servizio | Config ambienti esplicita, App Check verificato in staging, limiti server e log senza token/PII | `services/firebase.ts`, `firebase.json`, `.env.example`, comandi server; test bypass dal client e abuso oltre soglia configurata |

**Gate di uscita:** suite positiva esistente verde e suite negativa verde; nessuna fuga dei dati tra tenant; registrazione pubblica e inviti ancora utilizzabili. Endpoint e regole restrittive si rilasciano insieme dopo averne verificato la compatibilità. L'attivazione di servizi cloud o costi richiede verifica dei requisiti dell'account durante l'esecuzione: qui non è stata effettuata.

### Fase 2 — rendere affidabile la serata (32–48 ore)

**Risultato:** più operatori possono lavorare senza aggiornamenti manuali, duplicazioni o modifiche perse.

| Task | Intervento concreto | File iniziali e verifica |
|---|---|---|
| 2.1 Tempi e ciclo evento | Estrarre regole di apertura/chiusura; usare timestamp e fuso; draft/pubblicato/chiuso/archivio | `types.ts`, `PublicListPage.tsx`, `tests/listClosing.test.ts`, nuovo `domain/eventSchedule.ts`; test della logica importata dal prodotto e cambio ora legale |
| 2.2 Comando check-in | Transazione server, stato desiderato, requestId, audit, annullamento autorizzato; evitare `saveGuest` dell'intero documento | `GuestsTab.tsx`, `CheckInPage.tsx`, nuove funzioni door; test due browser sullo stesso ospite, timeout dopo commit e retry |
| 2.3 Dati live e stato rete | Listener per evento attivo, cleanup, scoping tenant/evento; conservare filtri e form durante refresh; error state con retry | `useEventData.ts`, `App.tsx`, `CheckInPage.tsx`; test cambio evento/account e aggiornamento tra tre operatori |
| 2.4 Tavoli e import | Prenotazioni separate, scritture atomiche per gruppi piccoli, job riprendibile per import grandi; preview duplicati; capienza applicata a tutti i percorsi | `TablesTab.tsx`, `GuestsTab.tsx`, repository per feature; test fallo al terzo nominativo e riavvio senza doppioni |
| 2.5 Archivio e migrazione | Archiviare normalmente; spostare migration legacy fuori onboarding; job server di delete a blocchi e pulizia config/token | `OnboardingModal.tsx`, `firestoreService.ts`, `scripts/migrate-v2.ts`; dry-run, conteggi prima/dopo e test cancellazione con dataset grande |

**Gate di uscita:** nessuna modifica persa nei test di concorrenza; nessun falso successo in assenza di rete; dati parziali riconoscibili e recuperabili.

**Rete instabile:** prima versione con elenco già caricato consultabile e stato “offline”; nessun check-in mostrato come confermato senza risposta server. Il fallback operativo va provato con lo staff. Una coda offline multi-dispositivo richiede una specifica separata di conflitti e riconciliazione: non viene promessa nel primo rilascio.

### Fase 3 — trasformare l'esperienza d'uso (40–56 ore)

**Risultato:** il responsabile capisce cosa fare prima, durante e dopo la serata senza ricostruire il flusso tra modali.

| Task | Intervento concreto | File iniziali e verifica |
|---|---|---|
| 3.1 Navigazione reale | URL per elenco, evento, liste, ospiti, tavoli, consuntivo e impostazioni; filtri nei search params | `App.tsx`, nuovo `app/router.tsx`; refresh, deep link e back/forward non perdono evento e tab |
| 3.2 Sistema UI | Token coerenti, Button/Input/Select/Dialog/Card/Table; id automatici, errori associati, focus trap e ritorno focus, reduced motion | `components/ui/*`, `index.css`, `tailwind.config.js`; tastiera, screen reader e modali verificati con componenti reali |
| 3.3 Preparazione evento | Dashboard oggi/prossimi/archivio; checklist prontezza; liste con stato e link stabile; duplicazione evento senza ospiti/token | `EventHome.tsx`, nuova `features/events/`; flusso prima lista condivisa sotto 3 minuti nel test utente |
| 3.4 Ospiti, door e tavoli | Ricerca prominente, filtri conservati, nomi disambiguati, azioni touch ≥44 px, tab con testo; prenotazioni e capienza distinte | `GuestsTab.tsx`, `CheckInPage.tsx`, `TablesTab.tsx`; 390/768/1440 px, nomi lunghi, 2.000 ospiti, iPhone Safari e Android Chrome reali |
| 3.5 Percorsi pubblici | Form breve, tariffa esplicita, successo distinto da consegna email; branding evento/locale, stati chiuso/revocato/rete; landing coerente | `PublicListPage.tsx`, `InviteAcceptPage.tsx`, `landing/*`; form mobile e link invalidi, copy aderente alle funzioni effettive |

**Gate di uscita:** primo evento e primo ingresso completati da persone che non hanno visto il codice; nessun blocco con tastiera; screenshot stabili dei flussi principali. Test desktop/mobile browser automatizzati non sostituiscono la prova sui dispositivi reali.

### Fase 4 — consuntivo e rilascio controllato (24–40 ore)

**Risultato:** i numeri spiegano la serata e il prodotto può essere rilasciato e recuperato con una procedura precisa.

| Task | Intervento concreto | File iniziali e verifica |
|---|---|---|
| 4.1 Metriche ed export | Separare iscritti/ingressi/posti prenotati, stima/incassato; centesimi e regole esplicite; CSV con newline reali, escaping e neutralizzazione formule | `services/metrics.ts`, `MailingListSection.tsx`, nuova `domain/csv.ts`; import del file in spreadsheet con virgole, accenti, virgolette e formule |
| 4.2 Contatti ed email | Consenso marketing opzionale e versionato; export contatti abilitati distinto da report ospiti; email server-side con stato e retry | `types.ts`, form pubblico, `services/email.ts`, funzioni mail; consegna fallita non duplica iscrizione e non dichiara invio riuscito |
| 4.3 Qualità del codice | Repository per feature; strict TypeScript graduale; warning risolti sul codice migrato; CI include typecheck, rules e scenari concorrenti | `tsconfig.json`, `eslint.config.js`, `.github/workflows/ci.yml`; installazione pulita e runtime CI documentato |
| 4.4 Prestazioni e monitoraggio | Lazy route, font necessari, limit/paginazione e listener scoped; misurare prima di virtualizzare; log errori senza PII, budget e letture | `App.tsx`, `index.tsx`, repository, config build; bundle per rotta, ricerca e rete lenta misurati con dataset realistico |
| 4.5 Deploy e recupero | Dev/staging/prod espliciti; preview hosting delle vere rotte; export backup, ripristino in ambiente separato, rollback di app/regole/funzioni | `firebase.json`, workflow e `scripts/`; prova completa di restore e release checklist firmata dal responsabile |

**Gate di uscita:** report riconciliato con un dataset noto, export apribile, restore riuscito, staging fedele all'hosting reale. Retention, testo privacy e basi di utilizzo dei dati vanno definiti con il responsabile del trattamento del locale prima del pilot; il piano descrive requisiti tecnici e non certifica conformità legale.

Obiettivo prestazioni proposto: ridurre di almeno il 30% il JS richiesto dalla prima visita alla rotta pubblica rispetto al bundle attuale da 232,99 KB gzip, misurando tutte le dipendenze effettivamente scaricate. Nessuna ottimizzazione accettata solo perché suddivide un file in chunk.

### Fase 5 — validare sul campo (16–24 ore di lavoro)

**Risultato:** il prodotto sostiene due serate e le correzioni rispondono a problemi osservati.

1. Simulare una serata con responsabile e tre operatori, 2.000 ospiti sintetici, nomi uguali, gruppi, link revocati e interruzioni di rete.
2. Preparare una guida di una pagina per ogni ruolo e provare il fallback operativo, incluse autorizzazione e gestione delle copie dei dati.
3. Seguire la prima serata con supporto concordato: annotare tempi di ricerca, duplicati, errori e passaggi incomprensibili senza raccogliere dati personali nei log diagnostici.
4. Correggere i cinque problemi più frequenti, rieseguire le verifiche colpite e riconciliare i conteggi.
5. Svolgere una seconda serata: considerare concluso il pilot quando non ci sono blocchi critici aperti e responsabile/staff confermano di poter usare il prodotto autonomamente.

Le ore includono preparazione e analisi, non una promessa di copertura illimitata delle serate. Le date reali vanno concordate prima dell'esecuzione della fase.

## 6. Migrazione e sequenza di rilascio

La migrazione deve conservare ospiti, appartenenze, prezzi e link validi. I dati legacy non diventano automaticamente proprietà del primo nuovo utente.

1. Inventariare dati e regole effettive con accesso autorizzato; salvare un backup e ripristinarlo in staging. Registrare record senza org, date ambigue e riferimenti mancanti.
2. Introdurre server e schema nuovi in modo compatibile. Nella fase transitoria impedire la creazione di profili privilegiati e leggere sia dati legacy ammessi sia dati nuovi; ogni eccezione ha un perimetro e una scadenza.
3. Convertire con script idempotente e dry-run: org assegnate da una mappa approvata, date con fuso verificato, tariffe e prenotazioni riconciliate. Registrare checkpoint e risultati senza token grezzi.
4. Collegare i nuovi client ai comandi server. Negare le vecchie scritture solo quando il percorso sostitutivo è pronto; forzare refresh/version gate dei client vecchi per evitare bypass o comportamenti incompatibili.
5. Validare il pilot, rimuovere compatibilità e migrazione dall'app. Conservare backup e documentazione di restore secondo la retention stabilita.

**Rollback:** un rollback della sola UI può essere incompatibile con regole e schema nuovi. Mantenere un pacchetto compatibile di app, regole e funzioni; fermare le mutazioni se necessario e riconciliare le scritture intervenute. Non ripristinare indiscriminatamente un backup precedente cancellando iscrizioni arrivate nel frattempo.

Le transazioni e i batch hanno vincoli di accesso alle regole e di dimensione; import e cancellazioni grandi devono essere spezzati e riprendibili. Riferimento tecnico: [transazioni e batch Firebase](https://firebase.google.com/docs/firestore/manage-data/transactions).

## 7. Metodo di esecuzione con Superpowers

Una roadmap così ampia non va trasformata in una singola modifica. Per ciascuna fase:

1. Produrre una specifica breve con scope, permessi, contratti, migrazione e risultati attesi; far revisionare quel documento.
2. Scrivere il piano esecutivo con file esatti, firme, test, passi e comandi. Salvare specifiche e piani nel repository in `docs/superpowers/specs/` e `docs/superpowers/plans/` al momento dell'esecuzione.
3. Implementare un risultato verificabile alla volta; riprodurre i difetti e scrivere test significativi prima delle modifiche al comportamento.
4. Eseguire verifiche pertinenti e review prima di considerare il task finito; tenere i cambi di regole, funzioni e client coerenti.
5. Rilasciare in staging, verificare il flusso completo e integrare il risultato prima di aprire la fase successiva.

Per contenere il costo operativo suggerisco implementazione nella sessione principale, task per task, con review ai confini di autorizzazione, concorrenza e migrazione. La scelta di usare subagenti va fatta quando si approva il piano esecutivo; nessun subagente è stato avviato per questo audit.

Ogni task finisce con una frase osservabile: “un utente esterno riceve permission denied”, “due browser vedono un solo ingresso”, “il CSV viene importato correttamente”. Il numero di file riscritti non è un risultato di prodotto.

## 8. Stima, priorità e decisioni aperte

| Fase | Ore stimate | Dipendenza |
|---|---:|---|
| 1. Accessi e percorsi pubblici | 48–72 | Baseline e accesso autorizzato alla configurazione di produzione |
| 2. Affidabilità operativa | 32–48 | Comandi e permessi fase 1 |
| 3. Esperienza d'uso | 40–56 | Contratti e stato dati stabilizzati |
| 4. Report e rilascio | 24–40 | Flussi principali funzionanti |
| 5. Pilot reale | 16–24 | Restore provato, staging accettato, staff disponibile |

**Totale: 160–240 ore.** A 20 ore/settimana: 8–12 settimane; a 40 ore/settimana: 4–6 settimane di lavoro, con possibili attese per pilot e accessi. Ricalibrare la stima dopo la fase 1 e dopo la prima serata; non equivale a un preventivo.

### Decisioni da risolvere nella rispettiva fase

1. Prima del progetto esecutivo: primo locale, volumi attesi, numero di operatori e dispositivi reali; i valori proposti sopra sono ipotesi.
2. Fase 1: configurazione pubblicata, accessi Firebase, requisiti/costi dei servizi server, soglie antiabuso e chi può revocare lo staff.
3. Fase 2: limite delle iscrizioni rispetto alla capienza, deadline della lista, regole ingresso gruppi, annullamento ingresso e fallback senza rete.
4. Fase 3: tariffazione effettiva, tono del brand e verifica pratica con responsabile e staff.
5. Fase 4: cosa conta come incasso registrato, destinatari degli export, retention dei dati e responsabilità sul consuntivo.

### Funzioni da rimandare fino a prova di necessità

1. Pagamenti online, ticketing fiscale e integrazioni contabili.
2. CRM/campagne marketing e invio WhatsApp automatico.
3. Planimetria visuale dei tavoli e inventario avanzato multi-locale.
4. App native e sincronizzazione offline multi-dispositivo.
5. Abbonamenti SaaS, self-service commerciale e account in più organizzazioni.

La scansione QR ospite è un'estensione da valutare dopo i dati del pilot: la condivisione QR delle liste esiste già, mentre un QR personale di ammissione richiede un token e un modello diversi.

## 9. Evidenze e limiti dell'audit

L'audit comprende lettura del codice, documenti e ultimi commit; unit test, lint, typecheck, build; sei E2E esistenti; dieci probe delle regole e ispezione desktop/mobile con dataset sintetico. I due test aggiuntivi di audit sono diagnostici: il loro passaggio attesta l'esecuzione del probe e della cattura, non l'assenza di vulnerabilità.

Materiale consultabile: [evidenze strutturate](AUDIT-EVIDENCE.json), [schermata desktop](audit-desktop.png), [schermata mobile](audit-mobile.png). Le schermate sono dello stato attuale con dati fittizi; non sono proposte di design futuro. Animazioni completate durante la cattura per evitare giudizi su frame transitori.

Non sono stati verificati regole pubblicate, enforcement App Check, log o budget reali, configurazione email, dati storici di produzione, rete di un locale, Safari/iOS reale, carico di 2.000 ospiti o restore. Le prove relative compaiono nella roadmap. La lettura del codice individua rischi, non dimostra incidenti avvenuti.

**Prossima azione: revisionare il perimetro della fase 1, poi produrre la sua specifica esecutiva.**
