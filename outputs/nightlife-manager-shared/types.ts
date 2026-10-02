// ===========================================
// ORGANIZATION (Multi-tenancy)
// ===========================================
export interface Organization {
  id: string;
  name: string;
  ownerId: string;           // UID dell'admin che ha creato l'org
  createdAt: string;
  logoUrl?: string;          // Per future customizzazioni
}

// ===========================================
// CORE ENTITIES
// ===========================================
export interface Event {
  id: string;
  organizationId?: string;   // Multi-tenancy: tenant isolation
  name: string;
  date: string;
  location: string;
  capacity: number;
  priceListMale?: number;    // Prezzo uomo in lista (€)
  priceListFemale?: number;  // Prezzo donna in lista (€)
  listClosingHours?: number; // Ore prima dell'evento per chiusura registrazioni (default: 6)
}

export interface PR {
  id: string;
  organizationId?: string;   // Multi-tenancy
  name: string;
  eventId: string; // PRs are assigned to specific events in this model for simplicity
}

export interface GuestList {
  id: string;
  organizationId?: string;   // Multi-tenancy
  name: string;
  prId?: string;         // PR opzionale: una lista può esistere senza essere assegnata a un PR
  eventId: string;
  publicToken?: string;  // Token univoco per link pubblico registrazione
}

export interface Guest {
  id: string;
  organizationId?: string;   // Multi-tenancy
  name: string;
  phone?: string;
  email?: string;      // Email per conferma e mailing list
  notes?: string;
  listId: string;
  eventId: string;
  tableId?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  isFemale?: boolean;  // true = donna, false/undefined = uomo
}

export interface Table {
  id: string;
  organizationId?: string;   // Multi-tenancy
  number: string;
  capacity: number;
  eventId: string;
  primaryGuestName?: string; // Nome di chi prenota il tavolo
  notes?: string; // Note tavolo (es. "Privé", "30€ a testa")
  price?: number;  // Prezzo tavolo (€)
  pricePerPerson?: boolean;  // Se true, prezzo è per persona
}

// ===========================================
// UI & AUTH
// ===========================================

// Single source of truth for user roles across the app.
// - admin:   organization owner / full access
// - staff:   invited member (can manage events/guests, no org-level admin)
// - pending: registered via invite link but not yet accepted
// NOTE: door check-in is a separate anonymous flow (CheckInPage), not a role.
export type Role = 'admin' | 'staff' | 'pending';

export type ViewState = 'EVENTS' | 'EVENT_DETAIL';

export enum Tab {
  HOME = 'Home',
  GUESTS = 'Ospiti',
  TABLES = 'Tavoli',
}

export interface DoorSession {
  id: string; // userId (anonymous)
  eventId: string;
  token: string;
  createdAt: string;
}

// ===========================================
// INVITES (Staff invitation system)
// ===========================================
export interface Invite {
  id: string;                  // The token IS the document ID (security: not stored as queryable field)
  organizationId: string;
  role: 'staff';               // Solo staff può essere invitato, admin si auto-crea
  createdBy: string;           // UID di chi ha creato l'invito
  createdAt: string;
  expiresAt: string;           // Scadenza invito (7 giorni)
  usedBy?: string;             // UID di chi ha accettato (se usato)
  usedAt?: string;
}