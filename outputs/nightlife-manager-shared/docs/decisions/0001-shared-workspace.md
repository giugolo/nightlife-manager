# ADR 0001 — repository condiviso, esecuzione separata

Stato: adottata per il setup locale; servizi remoti da attivare manualmente.
Data: 2026-10-02.

Contesto: due soci lavorano con agenti AI sullo stesso prodotto. Occorrono continuità tra sessioni, verifiche riproducibili e prevenzione delle sovrascritture.

Decisione: GitHub privato come fonte comune; un Codespace per socio; task piccoli in Issues; branch e checkout separati per ogni agente che scrive; integrazione con PR, CI e review dell'altro socio. AGENTS.md è la policy canonica, documentazione aggiuntiva consultata su necessità. Sviluppo ed E2E usano Firebase demo.

Conseguenze: condividiamo codice e decisioni, non la stessa cartella o le credenziali. Il devcontainer riduce differenze di tooling. La preview browser dell'app usa VS Code desktop e porte localhost private; un'eventuale preview web completa richiederà un proxy emulatori dedicato o uno staging separato. Non creiamo una piattaforma multi-agente, Kubernetes, un MCP custom o un server persistente senza necessità.

Alternative: cartella unica su server rischia collisioni e processi condivisi; soli clone locali aumentano divergenze di ambiente. Entrambe possono essere appropriate in seguito, ma Codespaces è la preferenza espressa dai soci.

Limiti: protezioni GitHub dipendono dal piano e dalla loro attivazione. Una direttiva non è una barriera di sicurezza. Staging Firebase, inviti e fatturazione non sono configurati da questi file.
