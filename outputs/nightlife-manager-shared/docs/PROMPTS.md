# Copia un prompt e sostituisci i campi tra parentesi

## Iniziare un task

```text
Lavora sul task [ID / link / percorso] di Dioniso.
Leggi AGENTS.md, il task e soltanto il contesto pertinente.
Prima di modificare, indica directory, branch, commit base, stato Git,
file coinvolti e prove di accettazione. Distingui fatti da ipotesi.
Rispetta scope e file assegnati; procedi con le azioni locali autorizzate.
Per modifiche di comportamento riproduci il problema e scrivi il test
di regressione prima del fix. Non usare risorse Firebase live.
Verifica il risultato e riporta comandi/esiti realmente eseguiti,
limiti e rischi. Non fare merge, deploy o migrazioni live.
Se emerge una decisione che supera lo scope, presenta le alternative.
```

## Riprendere dopo un cambio di sessione

```text
Riprendi [TASK] dal checkpoint [link/percorso]. Leggi AGENTS.md.
Controlla branch, commit e modifiche effettive; il checkpoint potrebbe
essere superato. Riporta la singola prossima azione e continua entro scope.
Non ripetere lavoro già presente e non dichiarare test senza eseguirli.
```

## Review con una sessione nuova

```text
Revisiona il diff [BASE..HEAD / PR] rispetto al task [TASK].
Leggi AGENTS.md, criteri e codice pertinente. Non modificare il codice.
Cerca regressioni osservabili, autorizzazioni, confini tra locali,
concorrenza e casi negativi pertinenti. Verifica i test proposti:
possono fallire per un difetto reale o confermano soltanto i mock?
Riporta soltanto problemi verificabili, con file/riga, impatto e caso
di riproduzione. Se non trovi difetti, indica limiti della review.
Non approvare o integrare automaticamente la PR.
```

Il testo del prompt non dimostra che un tool abbia letto le direttive. Alla prima sessione controllate che l'agente sappia indicare le regole di sviluppo demo e i comandi di verifica. In Codex `AGENTS.md` è il file canonico; `CLAUDE.md` importa lo stesso file per compatibilità; Copilot riceve un rimando breve. Non mantenete tre manuali diversi.
