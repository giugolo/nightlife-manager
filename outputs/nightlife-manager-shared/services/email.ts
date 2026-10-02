/**
 * Email service (client-only) basato su EmailJS (@emailjs/browser).
 *
 * VINCOLO ARCHITETTURALE: l'app è client-only (nessun backend / Cloud Function),
 * quindi l'invio email avviene lato browser tramite EmailJS. La public key di
 * EmailJS è pensata per essere esposta lato client; la sicurezza si ottiene
 * configurando su EmailJS l'allowlist dei domini e (consigliato) reCAPTCHA.
 *
 * ---------------------------------------------------------------------------
 * CONFIGURAZIONE
 * ---------------------------------------------------------------------------
 * Crea un file `.env.local` (NON committarlo — deve restare ignorato da git)
 * con le seguenti variabili Vite:
 *
 *   VITE_EMAILJS_PUBLIC_KEY=...     # "Public Key" dal pannello EmailJS (Account > General)
 *   VITE_EMAILJS_SERVICE_ID=...     # ID del servizio email (Email Services)
 *   VITE_EMAILJS_TEMPLATE_GUEST=... # ID del template di conferma ospite (Email Templates)
 *
 * Setup lato EmailJS (https://dashboard.emailjs.com):
 *   1. Crea un Email Service (es. Gmail/Outlook/SMTP) -> ottieni il SERVICE_ID.
 *   2. Crea un Email Template per la conferma ospite -> ottieni il TEMPLATE_GUEST.
 *      Nel template usa queste variabili (devono combaciare con i `templateParams`
 *      passati qui sotto):
 *        {{to_email}}        destinatario
 *        {{guest_name}}      nome ospite
 *        {{event_name}}      nome evento
 *        {{event_date}}      data evento (stringa già formattata)
 *        {{event_location}}  luogo evento
 *      Imposta il campo "To Email" del template a {{to_email}}.
 *   3. In Account > Security abilita l'allowlist dei domini consentiti
 *      (dominio di produzione + localhost per lo sviluppo) e, idealmente, reCAPTCHA.
 *
 * Se una qualsiasi delle env var manca, le funzioni di invio fanno un no-op
 * silenzioso (console.warn): l'assenza di configurazione NON deve mai rompere
 * il flusso di registrazione dell'ospite.
 */
import emailjs from '@emailjs/browser';

// Le variabili `VITE_*` vengono esposte da Vite su `import.meta.env`. Il progetto
// non include i tipi `vite/client`, quindi accediamo a `import.meta.env` tramite
// un cast esplicito per restare type-safe senza dipendere da quei tipi.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const PUBLIC_KEY = env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_GUEST = env.VITE_EMAILJS_TEMPLATE_GUEST;

let initialized = false;

/**
 * Inizializza EmailJS con la public key (idempotente).
 * Ritorna true se la configurazione è completa e l'init è andato a buon fine.
 */
const ensureInitialized = (): boolean => {
    if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_GUEST) {
        return false;
    }
    if (!initialized) {
        emailjs.init({ publicKey: PUBLIC_KEY });
        initialized = true;
    }
    return true;
};

export interface GuestConfirmationParams {
    toEmail: string;
    guestName: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
}

/**
 * Invia l'email di conferma all'ospite appena registrato.
 *
 * No-op silenzioso (console.warn, nessun throw) se la configurazione EmailJS
 * non è presente o se l'email del destinatario è vuota. Un eventuale errore di
 * rete viene rilanciato così che il chiamante possa loggarlo, ma il chiamante
 * NON deve far dipendere lo stato di successo della registrazione da questo invio.
 */
export const sendGuestConfirmation = async (params: GuestConfirmationParams): Promise<void> => {
    if (!ensureInitialized()) {
        console.warn(
            '[email] EmailJS non configurato: salto invio conferma. ' +
            'Imposta VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID e VITE_EMAILJS_TEMPLATE_GUEST in .env.local.'
        );
        return;
    }

    if (!params.toEmail.trim()) {
        console.warn('[email] Nessuna email destinatario fornita: salto invio conferma.');
        return;
    }

    const templateParams = {
        to_email: params.toEmail,
        guest_name: params.guestName,
        event_name: params.eventName,
        event_date: params.eventDate,
        event_location: params.eventLocation,
    };

    // SERVICE_ID e TEMPLATE_GUEST sono garantiti non-undefined da ensureInitialized().
    await emailjs.send(SERVICE_ID!, TEMPLATE_GUEST!, templateParams);
};
