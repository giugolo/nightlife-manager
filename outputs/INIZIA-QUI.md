# Dioniso — parti da qui

**Leggi la fase 1 del [piano completo](REWORK-MASTER-PLAN.md#fase-1--chiudere-gli-accessi-indebiti-4872-ore). Tempo di lettura: 2 minuti.**

Obiettivo confermato: usare Dioniso davvero per gestire locali e serate. La proposta è un rework progressivo che conserva React, TypeScript e Firebase e porta il prodotto a un pilot operativo.

## La decisione più importante

**La prima priorità è proteggere i dati.** Ho riprodotto 10 comportamenti indesiderati nelle regole Firestore del repository, su emulatori locali e dati sintetici. Per esempio, un admin di un'altra organizzazione può leggere gli ospiti di un evento; un nuovo utente può crearsi un profilo admin dentro un'organizzazione esistente.

Questo non dimostra quali regole siano oggi pubblicate online: la configurazione di produzione non è stata consultata. Il piano richiede il confronto con le regole pubblicate come prima attività dell'esecuzione.

## Cinque risultati, in questo ordine

1. **Dati protetti — 48–72 ore.** Autorizzazioni verificate, inviti affidabili, registrazioni pubbliche controllate, permessi door limitati.
2. **Serata affidabile — 32–48 ore.** Due operatori vedono gli stessi ingressi, le azioni non duplicano gli ospiti, tavoli e gruppi restano coerenti.
3. **Esperienza curata — 40–56 ore.** Preparazione, ingresso e consuntivo hanno schermate dedicate; mobile leggibile, interfaccia coerente, errori recuperabili.
4. **Rilascio controllato — 24–40 ore.** Report corretti, backup provato, ambienti separati, monitoraggio e procedura di ritorno alla versione precedente.
5. **Pilot reale — 16–24 ore di lavoro.** Simulazione, prima serata assistita, correzioni, seconda serata con verifica dei risultati.

**Stima totale: 160–240 ore**, per un implementatore che conosce React e Firebase, incluse verifiche e revisione. A 20 ore/settimana: 8–12 settimane; le date delle serate e le attese esterne possono allungare il calendario. Sono stime iniziali, da ricalibrare dopo la fase 1.

## Cosa è già verificato

| Controllo | Risultato |
|---|---|
| Test unitari e UI esistenti | 30/30 passano |
| End-to-end esistenti | 6/6 passano su emulatori demo |
| TypeScript | Nessun errore con la configurazione attuale |
| Lint | 0 errori, 15 avvisi |
| Build | Passa; JavaScript iniziale 910,50 KB, 232,99 KB gzip |

Le verifiche aggiuntive dell'audit hanno confermato 10 autorizzazioni indesiderate. Il fatto che i test esistenti passino non copre questi comportamenti. Desktop e mobile sono stati ispezionati con dati sintetici.

## Prima attività da affidare a chi implementa

> Prepara una copia isolata di Dioniso dal commit 6a702ad. Leggi il piano di rework. Confronta le regole Firestore pubblicate con quelle del repository attraverso accesso autorizzato. Trasforma i 10 casi dell'audit in test che richiedano il rifiuto delle operazioni indesiderate e documenta il risultato. Presenta la specifica della fase 1 prima di modificare il prodotto o pubblicare cambiamenti.

Il progetto originale non è stato modificato. Il piano contiene proposte da revisionare; l'implementazione non è iniziata.

**Prossima azione: apri il piano completo e leggi soltanto la fase 1.**
