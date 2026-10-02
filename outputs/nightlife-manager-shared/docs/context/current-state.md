# Stato verificato e rischi aperti

Base del prodotto: commit `6a702ad`, Dioniso 0.13.0. Obiettivo concordato: gestione reale di locali e serate. Il setup condiviso aggiunge tooling e un isolamento demo; non implementa il rework del prodotto.

React/TypeScript/Vite e Firebase Auth/Firestore restano lo stack. Le query e scritture sono oggi prevalentemente nel client; non c'è ancora il backend autorevole proposto dal piano. Il codice sorgente è la fonte per verificare i dettagli; i vecchi README/piani possono essere superati.

Audit precedente: 30 unit/UI test e 6 E2E passavano, ma 10 operazioni improprie erano consentite dalle Rules locali. Tra queste: accessi tra organizzazioni, autoassegnazione di ruoli, enumerazione pubblica delle liste e manipolazione di invitati/sessioni door. Queste vulnerabilità restano aperte: test generici verdi non certificano la sicurezza.

Il piano completo è in `docs/rework/REWORK-MASTER-PLAN.md`; il primo candidato di lavoro è `docs/tasks/SEC-001.md`. Non iniziarlo finché i soci non hanno assegnato responsabile, reviewer e scope. Non introdurre dati reali negli ambienti di sviluppo.

Altri rischi da verificare prima dell'uso reale: check-in concorrenti, salvataggio ospite con overwrite, operazioni multiple non atomiche, gestione errori e cancellazione dati. Per il comportamento corrente leggere i call site, non assumere che la proposta del piano sia già implementata.
