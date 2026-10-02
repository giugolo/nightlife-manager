import {
    collection,
    collectionGroup,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, PR, GuestList, Guest, Table, Organization, Invite } from '../types';
import { generateSecureToken, generatePublicToken } from './token';

// Collection references
const eventsCol = collection(db, 'events');

// --- EVENTS ---
export const firestoreService = {
    // Events
    // Multi-tenancy: filter by organizationId
    getEvents: async (organizationId?: string): Promise<Event[]> => {
        if (!organizationId) {
            // No org = no events (prevents seeing all events if not part of an org)
            return [];
        }
        const q = query(eventsCol, where('organizationId', '==', organizationId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    },

    // Multi-tenancy: inject organizationId on save
    saveEvent: async (event: Event, organizationId?: string): Promise<void> => {
        const eventRef = doc(eventsCol, event.id);
        await setDoc(eventRef, {
            name: event.name,
            date: event.date,
            location: event.location,
            capacity: event.capacity,
            priceListMale: event.priceListMale ?? null,
            priceListFemale: event.priceListFemale ?? null,
            listClosingHours: event.listClosingHours ?? 6,
            organizationId: organizationId || event.organizationId || null  // Preserve or inject
        });
    },

    deleteEvent: async (id: string): Promise<void> => {
        const batch = writeBatch(db);

        // Delete event
        batch.delete(doc(eventsCol, id));

        // Delete subcollections (PRs, Lists, Guests, Tables)
        const prsSnapshot = await getDocs(collection(db, `events/${id}/prs`));
        prsSnapshot.docs.forEach(d => batch.delete(d.ref));

        const listsSnapshot = await getDocs(collection(db, `events/${id}/lists`));
        listsSnapshot.docs.forEach(d => batch.delete(d.ref));

        const guestsSnapshot = await getDocs(collection(db, `events/${id}/guests`));
        guestsSnapshot.docs.forEach(d => batch.delete(d.ref));

        const tablesSnapshot = await getDocs(collection(db, `events/${id}/tables`));
        tablesSnapshot.docs.forEach(d => batch.delete(d.ref));

        await batch.commit();
    },

    // --- PRs ---
    getPRs: async (eventId: string): Promise<PR[]> => {
        const prsCol = collection(db, `events/${eventId}/prs`);
        const snapshot = await getDocs(prsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, eventId, ...doc.data() } as PR));
    },

    savePR: async (pr: PR): Promise<void> => {
        const prRef = doc(db, `events/${pr.eventId}/prs`, pr.id);
        await setDoc(prRef, { name: pr.name });
    },

    deletePR: async (pr: PR): Promise<void> => {
        const batch = writeBatch(db);

        // Delete PR
        batch.delete(doc(db, `events/${pr.eventId}/prs`, pr.id));

        // Delete associated lists and guests
        const listsSnapshot = await getDocs(
            query(collection(db, `events/${pr.eventId}/lists`), where('prId', '==', pr.id))
        );

        for (const listDoc of listsSnapshot.docs) {
            batch.delete(listDoc.ref);

            // Delete guests in this list
            const guestsSnapshot = await getDocs(
                query(collection(db, `events/${pr.eventId}/guests`), where('listId', '==', listDoc.id))
            );
            guestsSnapshot.docs.forEach(g => batch.delete(g.ref));
        }

        await batch.commit();
    },

    // --- LISTS ---
    getLists: async (eventId: string): Promise<GuestList[]> => {
        const listsCol = collection(db, `events/${eventId}/lists`);
        const snapshot = await getDocs(listsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, eventId, ...doc.data() } as GuestList));
    },

    saveList: async (list: GuestList): Promise<void> => {
        const listRef = doc(db, `events/${list.eventId}/lists`, list.id);
        const data: any = { name: list.name };
        // prId is optional now: only persist it when a PR is actually assigned
        // (Firestore rejects `undefined`).
        if (list.prId) {
            data.prId = list.prId;
        }
        if (list.publicToken) {
            data.publicToken = list.publicToken;
        }
        // merge:true so re-saving a list (e.g. a future rename) never wipes the
        // existing publicToken — that would silently break already-shared links.
        await setDoc(listRef, data, { merge: true });
    },

    // Generate and save public token for a list
    generateListPublicToken: async (list: GuestList): Promise<string> => {
        const token = generatePublicToken();
        const listRef = doc(db, `events/${list.eventId}/lists`, list.id);
        await setDoc(listRef, { publicToken: token }, { merge: true });
        return token;
    },

    // Get list by public token (for public registration page)
    getListByPublicToken: async (token: string): Promise<{ list: GuestList; event: Event } | null> => {
        // Search across all events' lists subcollections
        const listsQuery = query(collectionGroup(db, 'lists'), where('publicToken', '==', token));
        const snapshot = await getDocs(listsQuery);

        if (snapshot.empty) return null;

        const listDoc = snapshot.docs[0];
        const listData = listDoc.data();
        const eventId = listDoc.ref.parent.parent?.id;

        if (!eventId) return null;

        // Get the event
        const eventDoc = await getDoc(doc(eventsCol, eventId));
        if (!eventDoc.exists()) return null;

        const list: GuestList = {
            id: listDoc.id,
            eventId,
            name: listData.name,
            prId: listData.prId,
            publicToken: listData.publicToken
        };

        const event: Event = { id: eventDoc.id, ...eventDoc.data() } as Event;

        return { list, event };
    },

    deleteList: async (list: GuestList): Promise<void> => {
        const batch = writeBatch(db);

        // Delete list
        batch.delete(doc(db, `events/${list.eventId}/lists`, list.id));

        // Delete guests in this list
        const guestsSnapshot = await getDocs(
            query(collection(db, `events/${list.eventId}/guests`), where('listId', '==', list.id))
        );
        guestsSnapshot.docs.forEach(g => batch.delete(g.ref));

        await batch.commit();
    },

    // --- GUESTS ---
    getGuests: async (eventId: string): Promise<Guest[]> => {
        const guestsCol = collection(db, `events/${eventId}/guests`);
        const snapshot = await getDocs(guestsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, eventId, ...doc.data() } as Guest));
    },

    saveGuest: async (guest: Guest): Promise<void> => {
        const guestRef = doc(db, `events/${guest.eventId}/guests`, guest.id);
        await setDoc(guestRef, {
            name: guest.name,
            phone: guest.phone || '',
            email: guest.email || '',
            notes: guest.notes || '',
            listId: guest.listId,
            tableId: guest.tableId || null,
            checkedIn: guest.checkedIn || false,
            checkedInAt: guest.checkedInAt || null,
            isFemale: guest.isFemale ?? null
        });
    },

    deleteGuest: async (guest: Guest): Promise<void> => {
        await deleteDoc(doc(db, `events/${guest.eventId}/guests`, guest.id));
    },

    // --- TABLES ---
    getTables: async (eventId: string): Promise<Table[]> => {
        const tablesCol = collection(db, `events/${eventId}/tables`);
        const snapshot = await getDocs(tablesCol);
        return snapshot.docs.map(doc => ({ id: doc.id, eventId, ...doc.data() } as Table));
    },

    saveTable: async (table: Table): Promise<void> => {
        const tableRef = doc(db, `events/${table.eventId}/tables`, table.id);
        await setDoc(tableRef, {
            number: table.number,
            capacity: table.capacity,
            primaryGuestName: table.primaryGuestName || null,
            notes: table.notes || null,
            price: table.price ?? null,
            pricePerPerson: table.pricePerPerson || false
        });
    },

    deleteTable: async (table: Table): Promise<void> => {
        const batch = writeBatch(db);

        // Delete table
        batch.delete(doc(db, `events/${table.eventId}/tables`, table.id));

        // Unassign guests from this table
        const guestsSnapshot = await getDocs(
            query(collection(db, `events/${table.eventId}/guests`), where('tableId', '==', table.id))
        );

        guestsSnapshot.docs.forEach(g => {
            batch.update(g.ref, { tableId: null });
        });

        await batch.commit();
    },

    // --- MAILING LIST ---
    // Get guests with email (public registrations) for mailing list export
    getGuestsWithEmail: async (eventId: string): Promise<Guest[]> => {
        const guestsCol = collection(db, `events/${eventId}/guests`);
        const snapshot = await getDocs(guestsCol);
        return snapshot.docs
            .map(doc => ({ id: doc.id, eventId, ...doc.data() } as Guest))
            .filter(guest => guest.email && guest.email.trim() !== '');
    },

    // --- ORGANIZATIONS (Multi-tenancy) ---

    // Create a new organization
    createOrganization: async (org: Organization): Promise<void> => {
        const orgRef = doc(db, 'organizations', org.id);
        await setDoc(orgRef, {
            name: org.name,
            ownerId: org.ownerId,
            createdAt: org.createdAt,
            logoUrl: org.logoUrl || null
        });
    },

    // Get organization by ID
    getOrganization: async (orgId: string): Promise<Organization | null> => {
        const orgRef = doc(db, 'organizations', orgId);
        const snapshot = await getDoc(orgRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as Organization;
    },

    // Update user's organizationId (after onboarding)
    updateUserOrganization: async (userId: string, organizationId: string): Promise<void> => {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { organizationId }, { merge: true });
    },

    // Get user profile by ID
    getUserProfile: async (userId: string): Promise<{ uid: string; email: string; role: string; organizationId?: string } | null> => {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return null;
        return { uid: snapshot.id, ...snapshot.data() } as { uid: string; email: string; role: string; organizationId?: string };
    },

    // Generate a unique organization ID (secure random, with prefix)
    generateOrganizationId: (): string => `org_${generateSecureToken(16)}`,

    // Update an existing organization (name, logoUrl)
    updateOrganization: async (org: Organization): Promise<void> => {
        const orgRef = doc(db, 'organizations', org.id);
        await setDoc(orgRef, {
            name: org.name,
            ownerId: org.ownerId,
            createdAt: org.createdAt,
            logoUrl: org.logoUrl || null
        });
    },

    // Get aggregate statistics for an organization
    getOrganizationStats: async (organizationId: string): Promise<{ totalEvents: number; totalGuests: number; totalPRs: number }> => {
        // Get all events for this organization
        const q = query(eventsCol, where('organizationId', '==', organizationId));
        const eventsSnapshot = await getDocs(q);
        const totalEvents = eventsSnapshot.size;

        let totalGuests = 0;
        let totalPRs = 0;

        // For each event, count guests and PRs
        for (const eventDoc of eventsSnapshot.docs) {
            const eventId = eventDoc.id;

            // Count guests
            const guestsSnapshot = await getDocs(collection(db, `events/${eventId}/guests`));
            totalGuests += guestsSnapshot.size;

            // Count PRs
            const prsSnapshot = await getDocs(collection(db, `events/${eventId}/prs`));
            totalPRs += prsSnapshot.size;
        }

        return { totalEvents, totalGuests, totalPRs };
    },

    // Get all users belonging to an organization
    getOrganizationUsers: async (organizationId: string): Promise<Array<{ uid: string; email: string; displayName?: string; role: string }>> => {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('organizationId', '==', organizationId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(userDoc => ({
            uid: userDoc.id,
            email: userDoc.data().email || '',
            displayName: userDoc.data().displayName,
            role: userDoc.data().role || 'staff'
        }));
    },

    // Migrate legacy data (events, PRs, lists, guests, tables) to a new organization
    // This assigns organizationId to all documents that don't have one yet
    migrateLegacyData: async (organizationId: string): Promise<{ migratedEvents: number; migratedGuests: number }> => {
        const batch = writeBatch(db);
        let migratedEvents = 0;
        let migratedGuests = 0;

        // Get all events without organizationId
        const eventsSnapshot = await getDocs(eventsCol);

        for (const eventDoc of eventsSnapshot.docs) {
            const eventData = eventDoc.data();

            // Only migrate if no organizationId exists
            if (!eventData.organizationId) {
                // Update event with organizationId
                batch.update(eventDoc.ref, { organizationId });
                migratedEvents++;

                // Migrate all subcollections for this event
                const eventId = eventDoc.id;

                // PRs
                const prsSnapshot = await getDocs(collection(db, `events/${eventId}/prs`));
                prsSnapshot.docs.forEach(prDoc => {
                    if (!prDoc.data().organizationId) {
                        batch.update(prDoc.ref, { organizationId });
                    }
                });

                // Lists
                const listsSnapshot = await getDocs(collection(db, `events/${eventId}/lists`));
                listsSnapshot.docs.forEach(listDoc => {
                    if (!listDoc.data().organizationId) {
                        batch.update(listDoc.ref, { organizationId });
                    }
                });

                // Guests
                const guestsSnapshot = await getDocs(collection(db, `events/${eventId}/guests`));
                guestsSnapshot.docs.forEach(guestDoc => {
                    if (!guestDoc.data().organizationId) {
                        batch.update(guestDoc.ref, { organizationId });
                        migratedGuests++;
                    }
                });

                // Tables
                const tablesSnapshot = await getDocs(collection(db, `events/${eventId}/tables`));
                tablesSnapshot.docs.forEach(tableDoc => {
                    if (!tableDoc.data().organizationId) {
                        batch.update(tableDoc.ref, { organizationId });
                    }
                });
            }
        }

        // Commit all updates
        if (migratedEvents > 0) {
            await batch.commit();
        }

        console.log(`Migration complete: ${migratedEvents} events, ${migratedGuests} guests migrated to org ${organizationId}`);
        return { migratedEvents, migratedGuests };
    },

    // --- DOOR SESSIONS ---

    // Get the current door token for an event (Admin only)
    getDoorToken: async (eventId: string): Promise<string | null> => {
        const configRef = doc(db, `events/${eventId}/private_data/config`);
        const snapshot = await getDoc(configRef);
        if (snapshot.exists()) {
            return snapshot.data().doorToken;
        }
        return null;
    },

    // Generate/Rotate a door token for an event (Admin only)
    generateDoorToken: async (eventId: string): Promise<string> => {
        const token = generatePublicToken(); // Reuse the same random generator
        const configRef = doc(db, `events/${eventId}/private_data/config`);
        await setDoc(configRef, { doorToken: token }, { merge: true });
        return token;
    },

    // Create a door session for the current user (Anonymous Door User)
    createDoorSession: async (eventId: string, token: string, userId: string): Promise<void> => {
        const sessionRef = doc(db, 'door_sessions', userId);
        await setDoc(sessionRef, {
            eventId,
            token,
            createdAt: Timestamp.now()
        });
    },

    // NB: la validità reale della door session è imposta dalle security rules
    // (la CREAZIONE della sessione con un token non corrente viene negata → "Accesso Negato").
    // Niente verifica client-side sull'eventId, che era fuorviante e inutilizzata.

    // --- INVITES (Staff invitation system) ---

    // Generate secure invite token (24 characters, cryptographically secure)
    generateInviteToken: (): string => generateSecureToken(24),

    // Create a new invite for staff (7-day expiry)
    // SECURITY: Token IS the document ID - prevents enumeration attacks
    createInvite: async (organizationId: string, createdBy: string): Promise<Invite> => {
        const token = firestoreService.generateInviteToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Token is used as document ID - no token field stored!
        const invite: Invite = {
            id: token,  // Token IS the ID
            organizationId,
            role: 'staff',
            createdBy,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        const inviteRef = doc(db, 'invites', token);
        await setDoc(inviteRef, {
            organizationId: invite.organizationId,
            role: invite.role,
            createdBy: invite.createdBy,
            createdAt: invite.createdAt,
            expiresAt: invite.expiresAt
            // NOTE: No 'token' field - prevents enumeration via queries
        });

        return invite;
    },

    // Get invite by token (for acceptance page)
    // SECURITY: Direct document read - no query enumeration possible
    getInviteByToken: async (token: string): Promise<Invite | null> => {
        // Token IS the document ID - direct read, no query needed
        const inviteRef = doc(db, 'invites', token);
        const snapshot = await getDoc(inviteRef);

        if (!snapshot.exists()) return null;

        return { id: snapshot.id, ...snapshot.data() } as Invite;
    },

    // Accept an invite (assign org to user, update user role, mark invite as used)
    acceptInvite: async (inviteId: string, userId: string): Promise<void> => {
        const inviteRef = doc(db, 'invites', inviteId);
        const inviteSnapshot = await getDoc(inviteRef);

        if (!inviteSnapshot.exists()) {
            throw new Error('Invito non trovato');
        }

        const invite = inviteSnapshot.data() as Invite;

        // Check if already used
        if (invite.usedBy) {
            throw new Error('Invito già utilizzato');
        }

        // Check expiry
        if (new Date(invite.expiresAt) < new Date()) {
            throw new Error('Invito scaduto');
        }

        // Use batch for atomic update - both operations succeed or both fail
        const batch = writeBatch(db);

        // Update user profile with organizationId and role
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
            organizationId: invite.organizationId,
            role: invite.role  // 'staff'
        });

        // Mark invite as used
        batch.update(inviteRef, {
            usedBy: userId,
            usedAt: new Date().toISOString()
        });

        // Commit both operations atomically
        await batch.commit();
    },

    // Get all invites for an organization (admin only)
    // This still works because admins can query by organizationId
    getOrganizationInvites: async (organizationId: string): Promise<Invite[]> => {
        const invitesCol = collection(db, 'invites');
        const q = query(invitesCol, where('organizationId', '==', organizationId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(inviteDoc => ({
            id: inviteDoc.id,  // The ID is the token
            ...inviteDoc.data()
        })) as Invite[];
    },

    // Delete/revoke a pending invite
    deleteInvite: async (inviteId: string): Promise<void> => {
        await deleteDoc(doc(db, 'invites', inviteId));
    }
};
