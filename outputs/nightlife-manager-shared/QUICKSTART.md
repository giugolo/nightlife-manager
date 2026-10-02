# Apri il tuo Codespace, poi esegui `npm run dev`

Ogni socio usa il proprio account GitHub e il proprio Codespace sullo stesso repository privato.
Il progetto originale resta disponibile separatamente; questa copia contiene il setup condiviso.

## Primo accesso — circa 15 minuti dopo la pubblicazione

1. Apri il repository → Code → Codespaces → crea il **tuo** Codespace. Attendi il completamento di `postCreateCommand` (dipendenze e Chromium).
2. Aprilo in **VS Code desktop**. In Ports verifica che 3000, 8080 e 9099 siano private e inoltrate agli stessi numeri localhost. Se VS Code cambia un numero locale perché occupato, libera quella porta sul tuo computer e ripristina il numero.
3. Nel terminale remoto esegui `npm run dev`. Attendi Auth e Firestore pronti; apri `http://localhost:3000/app` nel browser del tuo computer.
4. Crea un account fittizio nell'app e una serata demo. I dati vengono persi quando fermi gli emulatori; non usare dati reali.
5. Per il primo task apri `docs/PROMPTS.md`, copia il prompt iniziale nel tuo agente e inserisci il task assegnato.

**Per gli agenti è sufficiente il terminale remoto.** Codex CLI, Claude Code o un'estensione nel Codespace lavorano sui file cloud; ciascuno autentica il proprio account AI. Per Codex desktop via SSH leggi `docs/SHARED-ENVIRONMENT.md`.

**Limite intenzionale:** la preview web `*.app.github.dev` non è il percorso supportato per l'app in questa configurazione: il browser deve raggiungere anche gli emulatori su localhost. Usa VS Code desktop con tutte e tre le porte inoltrate. Playwright gira nel Codespace e funziona senza questo inoltro. Non rendere gli emulatori pubblici per aggirare il limite.

## Comandi quotidiani

| Comando | Risultato |
|---|---|
| `npm run doctor` | Controlla Node, Java, CLI e configurazione demo |
| `npm run dev` | Avvia frontend + Auth/Firestore demo; Ctrl+C ferma i suoi processi |
| `npm run verify` | Lint, controllo tipi, unit/UI test e build |
| `npm run e2e` | Emulatori puliti su porte separate + browser test |
| `npm run setup` | Installazione da lockfile + Chromium, per un clone locale |

Non eseguire `npm run e2e:browser` da solo: è il comando interno chiamato dal runner.
`npm run preview` avvia la stessa demo di `npm run dev`. Il vecchio preview del bundle è disponibile come `preview:production`: contiene la configurazione Firebase live e richiede autorizzazione umana; non usarlo per i test quotidiani.
`npm run test:shutdown` verifica l'arresto anche con Java sospeso; eseguilo con lo sviluppo fermo. Fa parte della CI e richiede un ambiente POSIX (Codespaces Linux o macOS).
Java 21+ va installato e disponibile nel PATH per un clone locale. In Codespaces è configurato dal devcontainer.

**Regola quotidiana:** una issue → un responsabile → un branch → una PR → revisione del socio.
