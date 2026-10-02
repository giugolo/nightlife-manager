# Apri la guida di pubblicazione

**La copia pronta da pubblicare è `outputs/nightlife-manager-shared`.** Il progetto originale sul Desktop è rimasto invariato. La copia conserva la cronologia Git e aggiunge un commit di setup sul branch `setup/shared-ai-workspace`.

## Tre passi, circa 25 minuti dopo l'accesso GitHub

1. Segui [pubblicazione, invito e protezioni](nightlife-manager-shared/docs/SHARED-ENVIRONMENT.md). Repository e invito li fai tu, come richiesto. Prima del push controlla di essere nella copia indicata sotto.
2. Crea un Codespace per te e uno per il socio. Seguite [QUICKSTART](nightlife-manager-shared/QUICKSTART.md): il devcontainer configura Node 24.21, Java 21, Firebase CLI e Chromium. Per provare l'app usate VS Code desktop con le tre porte localhost private.
3. Assegnate una issue a testa usando [il flusso AI](nightlife-manager-shared/docs/AI-WORKFLOW.md) e [i prompt pronti](nightlife-manager-shared/docs/PROMPTS.md). Un task, un responsabile, un branch, una PR; l'altro socio revisiona e integra.

```bash
cd /Users/edoardo/Documents/Codex/2026-10-02/ho-questo-progetto-qua-lavorato-per/outputs/nightlife-manager-shared
```

## Cosa è predisposto

| Parte | Risultato |
|---|---|
| Ambiente | Devcontainer per Codespaces; SSH predisposto per agenti remoti |
| Sviluppo | Frontend e Firebase demo; nessun progetto Firebase live in modalità dev |
| Verifiche | CLI fissata nel lockfile, controlli locali, E2E indipendenti, CI con Actions fissate a SHA |
| Direttive AI | AGENTS canonico, compatibilità Claude/Copilot, task e checkpoint espliciti |
| Collaborazione | Template issue e PR; esempio CODEOWNERS da compilare; guida alle protezioni |

Per conservare o trasferire il progetto senza `node_modules`, c'è anche [il pacchetto Git completo](nightlife-manager-shared.bundle), circa 556 kB. Puoi ricreare la copia con `git clone -b setup/shared-ai-workspace /percorso/nightlife-manager-shared.bundle nightlife-manager`. Il bundle contiene sorgenti, configurazione e cronologia; le dipendenze vengono installate da lockfile. La [verifica strutturata](SHARED-SETUP-EVIDENCE.json) registra commit, controlli e parti cloud ancora da eseguire.

## Verificato e ancora da attivare

**Locale:** 31 test unit/UI e 6 E2E passano, typecheck e build passano. Lo sviluppo resta attivo durante gli E2E; un secondo avvio è rifiutato senza interrompere il primo; l'arresto libera tutte le porte usate. Restano 15 warning di lint preesistenti. Dettagli e limiti: [SETUP-VERIFICATION](nightlife-manager-shared/docs/SETUP-VERIFICATION.md).

**Manuale/cloud:** pubblicazione, invito, due Codespaces, autenticazioni AI, prima build Linux/Java 21, CI remota e protezioni GitHub. Lo staging Firebase comune non è stato creato. Questo setup non corregge ancora le vulnerabilità del prodotto e non autorizza l'uso di dati reali.

Per imporre tecnicamente le regole sul repository privato, verificate un piano GitHub compatibile con i ruleset; su Free privato le sole convenzioni non bloccano il push diretto. La guida distingue configurazione locale da protezioni effettivamente attivate.

## Metodo scelto

Direttive brevi e contesto letto quando pertinente; task con comportamenti osservabili e casi negativi; prove eseguite invece di dichiarazioni dell'agente; memoria nei commit/issue/checkpoint; review AI selettiva e review umana del socio. Le [fonti ufficiali consultate](nightlife-manager-shared/docs/RESEARCH.md) includono indicazioni OpenAI e Anthropic del 2026 e la documentazione GitHub/Firebase. Le allucinazioni si riducono con evidenze e controlli; non si eliminano con un prompt.

**Prossima azione, meno di 2 minuti:** apri la guida di pubblicazione e crea su GitHub il repository privato vuoto.
