# Assegna un risultato osservabile all'agente

Per due soci conviene un processo piccolo: task con prove di accettazione, ambienti separati, test automatici e review umana. È la nostra scelta progettuale, basata sulle fonti in `RESEARCH.md`; non esiste una metodologia che garantisca zero allucinazioni.

## Un task pronto — 5 minuti

1. Descrivi un comportamento: «un admin del locale B non può leggere gli ospiti del locale A». Evita «rifai tutta la sicurezza».
2. Assegna un responsabile umano e un reviewer, annota commit base e dipendenze. In due, il reviewer è il socio.
3. Elenca file consentiti, invarianti e fuori scope. Prenota nella issue i file condivisi con altri task.
4. Definisci casi positivi e negativi e il comando che li prova. Se cambia un contratto condiviso, decidetelo prima di assegnare lavoro concorrente.
5. Avvia l'agente con il prompt di `PROMPTS.md`. Il primo output deve indicare checkout, branch e piano breve.

Usate GitHub Issues come unica lista di lavoro, con stati Ready → In progress → Review → Done. Potete partire con semplici label; GitHub Projects è facoltativo. Una issue in progress ha un solo responsabile. Un task tipico deve poter produrre una PR in una sessione di 1–3 ore; se richiede più giorni, dividetelo per comportamento verificabile, non per numeri arbitrari di righe.

## Come ridurre errori e supposizioni

**Evidenze prima della soluzione.** L'agente deve leggere i call site, il modello dati e i test pertinenti. Un'affermazione tecnica importante deve collegarsi al codice o a documentazione ufficiale aggiornata. Se non sa, scrive «non verificato» e sceglie una verifica concreta. README e piani vecchi possono essere sbagliati; non farli prevalere automaticamente sull'implementazione.

**Contesto selettivo.** `AGENTS.md` contiene le regole permanenti; il task contiene il risultato; una decisione architetturale contiene il motivo. Leggete ulteriori documenti quando servono. Non incollate ogni volta l'intero repository, tutte le vecchie chat e tutti i piani. Una sessione lunga può perdere dettagli: il checkpoint verificabile consente un nuovo contesto senza ricostruire la storia a memoria.

**Il test deve poter smentire l'agente.** Per una correzione riproduci il difetto prima, mostra il test che fallisce, applica il fix e mostra che passa. Oltre al caso felice, verifica ruolo sbagliato, locale sbagliato, risorsa mancante/scaduta e doppia richiesta quando pertinenti. Non accettare test che sostituiscono proprio il comportamento in esame con un mock «sempre OK». Per Firestore servono test con le Rules reali negli emulatori; gli attuali E2E non coprono tutte le vulnerabilità dell'audit.

**Stop al cambiamento incontrollato.** L'agente può risolvere dettagli locali entro scope. Se deve cambiare schema dati, permessi, dipendenze importanti o altri task, lascia una proposta con impatto e chiede una decisione. Non si blocca su ogni refactor minimo e non fa una riscrittura completa per sistemare un bug.

## Durante il lavoro — un ciclo per PR

1. Crea il branch da `origin/main` aggiornato e verifica che il checkout sia pulito. Se ci sono modifiche precedenti, preservale e chiarisci la proprietà prima di sovrapporre lavoro.
2. Riproduci il problema e fai la modifica minima. Controlla il diff prima di ogni checkpoint significativo.
3. Esegui test pertinenti durante il lavoro; prima della PR esegui `npm run verify` e `npm run e2e`. Riporta anche ciò che non puoi verificare.
4. Apri una PR usando il template, con esempi prima/dopo, prove e rischi. CI deve verificare il commit finale, non un commit precedente.
5. Il socio revisiona e integra quando i criteri sono soddisfatti. Dopo nuovi commit rilevanti, la review va aggiornata.

La review AI può cercare casi limite con un contesto nuovo, ma non sostituisce il socio e non garantisce indipendenza: agente autore e reviewer possono condividere gli stessi errori. Usatela soprattutto su auth, dati, concorrenza e migrazioni. Non spendete una squadra di agenti per cambiare una label.

## Lavorare contemporaneamente

Il repository è condiviso; la cartella scrivibile no. Due persone usano due Codespaces. Due agenti che scrivono non condividono lo stesso checkout. Se un socio avvia un secondo agente, crea un altro checkout/worktree con branch proprio; per integrazione con emulatori usa un altro Codespace oppure serializza l'E2E. Un worktree separa i file Git, ma non porte, processi, cache o credenziali.

Buon parallelismo: una PR aggiunge test di autorizzazione; un'altra modifica un componente UI con un contratto invariato e file distinti. Cattivo parallelismo: due agenti riscrivono `firestoreService.ts`, `types.ts` o `package-lock.json` sulla base di assunzioni diverse. Prima definite il contratto, poi implementate; chi integra controlla i consumatori, non soltanto i singoli diff.

Non tenete una coda di dieci branch aperti. Iniziate con una PR attiva a testa; quando aspettate una dipendenza fate review o documentazione. Per auth e Rules tenete una sola PR principale alla volta.

## Cambio sessione — 3 minuti

Il checkpoint contiene: task e branch, commit verificato, file modificati, decisioni, comandi con esito, problema aperto e singola prossima azione. Non contiene credenziali o dati ospiti. Conservatelo nel task o nella issue, rendendo visibile chi l'ha aggiornato. In ripresa l'agente verifica il commit, non si fida ciecamente del checkpoint.

Una chat nuova serve quando il task cambia, l'agente ripete tentativi o il contesto è troppo rumoroso. Non cambiate modello sperando che ricordi una conversazione che non ha: fornite task, codice e checkpoint.

## Definizione di completamento

Un task è Done quando il comportamento previsto è presente, le prove richieste passano sul commit finale, la CI remota è verde, il socio ha revisionato, i documenti/contratti cambiati sono aggiornati e la PR è integrata. «Sembra funzionare» e «l'agente dice finito» non sono criteri sufficienti.

Per modifiche solo documentali bastano controlli pertinenti su contenuto e link; indicate l'esenzione dalle suite. Non cancellate test negativi, non disabilitate Rules o typecheck per accelerare il merge. Se un test è instabile, aprite un difetto con riproduzione; i retry non trasformano un flake in prova di affidabilità.

## Revisione del processo — 20 minuti ogni settimana

Guardate tre segnali: PR che richiedono correzioni dopo il merge, tentativi ripetuti sugli stessi difetti e tempo speso a preparare contesto. Accorciate regole inutili, aggiungete una regola soltanto dopo un errore concreto ricorrente e trasformate i difetti reali in test. Mantenete un backlog dei rischi; non confondete un ambiente ben organizzato con un prodotto già sicuro.
