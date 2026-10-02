# Pubblica questa copia e crea due ambienti separati

Stato: configurazione preparata localmente; repository remoto, invito, Codespaces e protezioni GitHub vengono attivati manualmente dal proprietario. Nessun accesso cloud viene implicato dai file locali.

## Pubblicazione — 10 minuti, esclusi accesso e fatturazione

1. Su GitHub crea un repository **privato vuoto** chiamato `nightlife-manager`, senza README o licenza automatici. Per un progetto comune, preferisci un'organizzazione di cui entrambi controllate la continuità; un account personale va bene per iniziare.
2. Apri un terminale in questa copia. Il commit del setup è su `setup/shared-ai-workspace`; pubblicalo come `main` usando i comandi sotto. La cronologia del progetto è conservata. Non usare l'upload web: ometterebbe la cronologia e rende facile perdere file nascosti.
3. Invita il socio con permesso Write e verifica che abbia accettato. Ciascuno usa credenziali proprie; nessun account AI condiviso.
4. Attiva Actions. Attendi che `Quality` e `E2E` passino su GitHub. Configura le protezioni descritte sotto; crea una issue di prova e una piccola PR per verificare il giro completo.
5. Ciascuno crea un proprio Codespace. Controlla il budget prima dell'avvio e segui `QUICKSTART.md`.

```bash
# Sostituisci OWNER con il proprietario reale. Usa SSH se lo hai già configurato.
git remote add origin https://github.com/OWNER/nightlife-manager.git
git push -u origin HEAD:main
```

Dopo il push seleziona `main` come default branch in GitHub. Sui Codespaces nuovi partirai da quel branch; crea un branch di task prima delle modifiche. Per collegare il clone originale, aggiungi lo stesso remoto e fai fetch; non fare reset o pull finché non hai verificato le eventuali differenze locali.

## Protezioni GitHub — configurazione manuale

In Settings → Rules → Rulesets crea una regola attiva su `main`: richiedi pull request, **una approvazione umana**, annulla approvazioni dopo nuovi commit, richiedi risoluzione delle conversazioni e i check `Quality` e `E2E`, impedisci force push e cancellazione. Richiedi branch aggiornato prima del merge. Niente bypass quotidiano; il socio revisiona e integra. Controlla i nomi effettivi dei check dopo la prima esecuzione.

I ruleset sui repository privati richiedono un piano GitHub compatibile: Pro, Team o Enterprise Cloud. Su Free privato non dichiarare il processo tecnicamente bloccato: le convenzioni da sole non impediscono un push diretto. Per due soci che vogliono obblighi verificabili, scegli un piano compatibile senza acquistarlo automaticamente. [Disponibilità ufficiale](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

Rinomina `.github/CODEOWNERS.example` in `CODEOWNERS` dopo aver sostituito gli username commentati e aver rimosso `#` dalla riga. Abilita review dei code owner se desiderata. Questo template non richiede review automaticamente finché non lo attivi. Abilita secret scanning/push protection dove disponibili per il vostro piano. Dependabot è predisposto per dipendenze npm e Actions.

## Ambienti, dati e credenziali

| Ambiente | Uso | Accesso ai dati |
|---|---|---|
| Codespace personale | Scrittura, test, agenti | Solo dati fittizi in emulatori |
| CI GitHub | Verifica PR | Emulatori usa e getta; token read-only |
| Staging comune | Validazione di ciò che avete integrato | Da predisporre con progetto Firebase separato |
| Produzione | Operazioni reali | Rilascio umano autorizzato |

Lo staging online non è stato creato: richiede un progetto Firebase dedicato e autorizzazioni. Finché le vulnerabilità del piano rework non sono risolte, non aprire preview con dati reali. Questo setup non distribuisce il prodotto e non cambia le Firestore Rules.

Codespaces ricostruisce il tooling da `.devcontainer/devcontainer.json`; Node è fissato a 24.21.0, Java a 21, Firebase CLI a 15.20.0 e dipendenze npm al lockfile. Image e feature usano canali versionati: non promettiamo riproducibilità binaria assoluta. Per congelare anche il sistema operativo, dopo la prima build cloud validata fissate i digest delle image/feature e pianificate gli aggiornamenti.

Non inserire Firebase Admin/service account, PAT GitHub, credenziali AI o dati ospiti nel repository. Il client Firebase contiene identificativi pubblici preesistenti, non credenziali amministrative. Una variabile `VITE_*` entra nel bundle browser: non può custodire segreti. Ogni agente nel Codespace può leggere le credenziali disponibili a quell'utente: limitate token e permessi; le direttive testuali non lo impediscono.

Le porte devono restare private. Con VS Code desktop le tre porte diventano localhost sul vostro computer; in caso di porte locali occupate, controllate il mapping. [Port forwarding ufficiale](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).

## Collegare gli agenti

**Percorso semplice:** apri il Codespace in VS Code, usa l'estensione scelta o installa il CLI del tuo provider nel terminale remoto, poi autenticati con il tuo account. L'installazione dei CLI AI è personale e non automatica: non mettiamo login o versioni provider nel progetto. Codex CLI: `npm install -g @openai/codex`, poi `codex`; verifica la procedura di autenticazione corrente nella [documentazione ufficiale](https://learn.chatgpt.com/docs/codex/cli). Per Claude Code segui la [procedura ufficiale](https://code.claude.com/docs/en/setup), senza copiare token del socio.

**Codex desktop via SSH:** sul computer installa GitHub CLI, autenticati con `gh auth login` e usa `gh codespace ssh --config` per ottenere gli alias SSH del tuo Codespace. Salva la configurazione richiesta da GitHub e verifica `ssh ALIAS`. Nel terminale remoto installa/autentica Codex; `codex` deve essere nel PATH della shell di login. In Codex desktop aggiungi l'host SSH e apri la directory `/workspaces/nightlife-manager` (verifica il percorso effettivo con `pwd`). Supporto e schermate possono dipendere dalla versione dell'app: il terminale remoto resta il percorso principale. [GitHub SSH](https://docs.github.com/en/codespaces/developing-in-a-codespace/using-github-codespaces-with-github-cli), [Codex SSH](https://learn.chatgpt.com/docs/remote-connections).

Non collegare l'agente soltanto al clone del portatile pensando che operi in cloud: verifica `pwd` e `hostname` nel suo terminale. Le chat non sono la memoria condivisa; issue, commit, documenti e checkpoint lo sono.

## Costi e arresto

Partite da due Codespaces, uno a testa. Impostate timeout di inattività a 30 minuti, fermateli a fine sessione e rivedete storage e budget ogni settimana. I Codespaces fermati possono continuare a occupare storage; le quote personali e quelle dell'organizzazione differiscono. Verificate la [fatturazione ufficiale](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces) prima dell'attivazione. Nessun piano o consumo cloud viene acquistato da questo setup.
