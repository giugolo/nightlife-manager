# Landing Page Dioniso - Documentazione Tecnica

## Panoramica

La landing page di Dioniso è una pagina HTML/CSS/JS **standalone**, separata dall'applicazione React principale. Questo approccio è stato scelto per:

- **SEO**: HTML statico indicizzabile dai motori di ricerca
- **Performance**: Caricamento istantaneo senza bundle React
- **Semplicità**: Facile da modificare senza conoscere React

## Struttura File

```
landing/
├── index.html    # Struttura HTML della pagina
├── styles.css    # Stili CSS (tema dark, animazioni)
└── script.js     # JavaScript per animazioni scroll
```

## Come Funziona il Routing

### Sviluppo Locale
- **Landing page**: `http://localhost:3000/landing/index.html`
- **App React**: `http://localhost:3000/` (o qualsiasi altra route)

### Produzione (Firebase Hosting)
Configurato in `firebase.json`:

| URL | Destinazione |
|-----|-------------|
| `/` | `/landing/index.html` |
| `/app`, `/app/**` | `/index.html` (React) |
| `/lista/**` | `/index.html` (React) |
| `/invite/**` | `/index.html` (React) |
| `/checkin/**` | `/index.html` (React) |

## Build Process

Il plugin `copyLandingPlugin` in `vite.config.ts` copia automaticamente la cartella `landing/` in `dist/landing/` durante `npm run build`.

## Come Modificare

### Cambiare testi
Modifica direttamente `landing/index.html`. I testi principali sono:
- Hero title/subtitle
- Feature cards (titoli e descrizioni)
- CTA section

### Cambiare stili
Modifica `landing/styles.css`. Variabili CSS in `:root`:
```css
--color-primary: #8b5cf6;    /* Viola primario */
--color-accent: #c084fc;      /* Viola chiaro */
--color-bg: #020617;          /* Sfondo scuro */
```

### Aggiungere sezioni
1. Aggiungi HTML in `index.html`
2. Aggiungi stili in `styles.css`
3. Per animazioni scroll, aggiungi classe `animate-on-scroll`

## Potenziali Problemi

### 1. Route Conflicts
**Problema**: Se qualcuno accede direttamente a `/` in sviluppo, vedrà l'app React, non la landing.

**Soluzione**: In sviluppo, accedere a `/landing/index.html`. In produzione Firebase gestisce correttamente i rewrites.

### 2. Link "Accedi" in Sviluppo
**Problema**: Il link `/app` non funziona in sviluppo locale perché Vite non ha i rewrites Firebase.

**Workaround**: In sviluppo cambiare temporaneamente l'href a `/` oppure testare direttamente la landing servita con altro server.

### 3. Caching CDN
**Problema**: Dopo un deploy, gli utenti potrebbero vedere versione cached.

**Soluzione**: Firebase usa hashing automatico per asset. Per forzare refresh della landing, aggiungere query string ai link CSS/JS o usare versioning.

### 4. Build Failure
**Problema**: Se la cartella `landing/` non esiste, il build fallisce.

**Soluzione**: Il plugin controlla `fs.existsSync()` prima di copiare.

### 5. Asset Path
**Problema**: I path relativi potrebbero non funzionare in sottocartelle.

**Soluzione**: La landing usa path assoluti (`/landing/styles.css`) quando necessario.

## Comandi Utili

```bash
# Build con landing page
npm run build

# Verifica che landing/ sia in dist/
ls -la dist/landing/

# Deploy su Firebase
npx firebase deploy --only hosting
```

## Future Migliorie

- [ ] Aggiungere meta tags Open Graph per social sharing
- [ ] Aggiungere favicon dedicato
- [ ] Form di contatto/waitlist
- [ ] Sezione pricing quando RevenueCat è integrato
- [ ] Analytics tracking (Google Analytics o simile)
