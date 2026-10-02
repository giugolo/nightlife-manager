# Verifica del setup — 2 ottobre 2026

Verifica locale della copia condivisa su macOS arm64, Node **24.21.0**, npm **11.19.0**, Java **26**, Firebase CLI **15.20.0**. Il devcontainer e la CI sono configurati con Java **21**; la loro prima esecuzione cloud è ancora da fare.

| Controllo | Esito osservato |
|---|---|
| Installazione `npm ci` dal nuovo lockfile | Passa: 1085 pacchetti installati |
| `npm run doctor` | Passa |
| `npm run verify` | Passa: lint senza errori, typecheck, 31 test, build |
| `npm run e2e` | Passa: 6 test con Auth/Firestore demo |
| E2E durante sviluppo attivo | Passa: 6 test su porte separate, app ancora raggiungibile |
| Secondo avvio dello sviluppo | Rifiutato; il primo ambiente resta attivo |
| Arresto | Tutte le 12 porte dei due ambienti risultano libere |
| `npm run test:shutdown` | Passa: anche Java sospeso viene rimosso entro il limite di arresto |
| Config devcontainer | Validata contro lo schema ufficiale Dev Containers |
| YAML e link Markdown locali | Sintassi/link validi |
| Diff Git | Nessun errore whitespace; repository originale pulito |

Il nuovo test Firebase è stato eseguito prima della modifica e falliva perché il progetto era `nightlife-manager-app`; dopo la modifica passa con `demo-nightlife-manager`. La build di produzione contiene ancora l'ID live preesistente e non contiene l'ID demo.

La review indipendente ha rilevato che Firebase avvia Java in un processo detached: un blocco di Java poteva sopravvivere al runner. Riproduzione osservata prima della correzione: assertion negativa con Java ancora attivo. Il runner ora registra i PID effettivamente avviati dalla sua CLI tramite IPC e attende/termina soltanto quei processi. La riproduzione passa dopo la correzione; il test è conservato nella CI. La review successiva non ha rilevato altri problemi bloccanti. Controllare questa integrazione quando si aggiorna Firebase CLI.

**Limiti rilevanti:** persistono 15 warning di lint preesistenti e il warning Vite sul bundle iniziale superiore a 500 kB. L'installazione segnala dipendenze transitive deprecate e alcuni install script da revisionare secondo la policy npm; il setup non è un audit completo delle dipendenze. Aggiungere Firebase CLI modifica anche cinque versioni transitive protobuf; le versioni delle dipendenze applicative dirette sono conservate.

Il prodotto mantiene le vulnerabilità individuate dall'audit precedente. Questa verifica certifica soltanto i controlli elencati sul setup locale. Non verifica Rules distribuite, produzione, login AI, accesso del socio, build container Linux, collegamento SSH reale o CI GitHub. Docker non è disponibile su questa macchina, e pubblicazione/invito sono stati lasciati manuali per richiesta dell'utente.

**Prima accettazione cloud:** attendere `Quality` e `E2E` verdi su GitHub, creare due Codespaces, completare il post-create, verificare `npm run doctor`, aprire la demo tramite le tre porte localhost private e far aprire a entrambi una PR di prova. Non configurare servizi email o altre integrazioni live nell'ambiente demo.
