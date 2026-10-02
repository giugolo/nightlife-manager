# Fonti consultate il 2 ottobre 2026

La raccomandazione è una sintesi per questo progetto: non una promessa di zero errori e non un obbligo universale di usare tanti agenti.

## Direttive e contesto

[OpenAI — Rethinking skills and prompts, 11 settembre 2026](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): rivedere istruzioni troppo lunghe e rituali diventati inutili; caricare contesto pertinente al task. Applicazione: AGENTS breve, guide su richiesta, nessun fan-out obbligatorio.

[Codex — AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): istruzioni persistenti con ambito di directory. Applicazione: una policy canonica nel repository, senza riferimenti ai percorsi personali dei soci.

[Claude Code — Memory](https://code.claude.com/docs/en/memory): import di file e direttive con ambito. Applicazione: CLAUDE.md importa AGENTS.md; evitiamo copie divergenti delle regole. Gli import non riducono da soli il contesto caricato.

## Sessioni lunghe e valutazione

[Anthropic — Effective harnesses for long-running agents, 26 novembre 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): progresso persistente, lavoro incrementale e verifica dell'app. Applicazione: task con checkpoint, commit identificabili e prove E2E.

[Anthropic — Harness design for long-running apps, 24 marzo 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps): valutazione separata e struttura adattata alle capacità del modello; controlli superficiali possono ignorare difetti. Applicazione: reviewer con casi negativi e semplificazione del processo quando un controllo non aggiunge evidenza.

## Ambienti ed enforcement

[GitHub — Dev containers](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers): configurazione dell'ambiente conservata nel repository. [Codex — Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees): checkout separati per lavoro parallelo. Applicazione: ambienti per persona e checkout per agente; le porte richiedono comunque coordinamento.

[GitHub — Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets): protezioni tecniche, con disponibilità diversa sui repository privati. Applicazione: PR, una review umana e check required, attivati manualmente su piano compatibile.

[GitHub — Port forwarding](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace): porte private e mapping localhost da VS Code desktop. Applicazione: emulatori mai pubblici.

[Firebase — Connect Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore): progetto demo senza risorse live e necessità di Java aggiornata. [Node — Releases](https://nodejs.org/en/about/previous-releases): Node 24 è LTS; Node 20 è EOL alla data della ricerca. Applicazione: Node 24 fissato e Java 21.

## Cosa non adottiamo adesso

Nessun framework multi-agente custom per due soci, niente memoria segreta affidata alle chat, nessun deploy autonomo. Non basiamo il flusso su Codex Cloud legacy. Le direttive cambieranno quando avremo evidenze dal vostro lavoro; test e controlli tecnici restano necessari anche con modelli più capaci.
