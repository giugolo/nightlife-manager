import React, { useState, useEffect, useMemo } from 'react';
import { Search, Check, X, User, Users, ClipboardCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { Event, Guest, GuestList } from '../types';
import { firestoreService } from '../services/firestoreService';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { useToast } from '../contexts/ToastContext';

interface CheckInPageProps {
    eventId: string;
    token: string;
}

const CheckInPage: React.FC<CheckInPageProps> = ({ eventId, token }) => {
    const [event, setEvent] = useState<Event | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [lists, setLists] = useState<GuestList[]>([]);
    const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [sessionValid, setSessionValid] = useState(false);
    const [initializing, setInitializing] = useState(true);
    // When a real (non-anonymous) account is logged in we do NOT silently create a
    // door session under their UID (would mix the operator flow with their account).
    // We hold their email and ask for an explicit choice instead.
    const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const { showToast } = useToast();

    // Map list IDs to Names for quick lookup
    const listNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        lists.forEach(l => map[l.id] = l.name);
        return map;
    }, [lists]);

    // Initialize Session - MUST wait for auth state
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let mounted = true;

        const initSession = async (user: import('firebase/auth').User) => {
            if (!mounted) return;

            try {
                // Create/Verify Door Session with the current user
                await firestoreService.createDoorSession(eventId, token, user.uid);
                if (!mounted) return;
                setSessionValid(true);

                // Load Event Data
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (!mounted) return;
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
                }

                // Load Lists (Door context needs to know list names)
                const fetchedLists = await firestoreService.getLists(eventId);
                if (!mounted) return;
                setLists(fetchedLists);

                // Load Guests
                await loadGuests();
            } catch (err) {
                console.error("Door Session Init Error:", err);
                if (mounted) {
                    setSessionValid(false);
                    showToast('Errore di accesso. Link non valido o scaduto.', 'error');
                }
            } finally {
                if (mounted) {
                    setInitializing(false);
                    setLoading(false);
                }
            }
        };

        if (eventId && token) {
            setInitializing(true);

            // Wait for auth state to be determined before proceeding
            unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
                if (!mounted) return;

                // A real account is logged in: don't hijack it for the door flow.
                // Ask the user to explicitly continue as an anonymous door operator.
                if (firebaseUser && !firebaseUser.isAnonymous) {
                    setBlockedEmail(firebaseUser.email || 'il tuo account');
                    setInitializing(false);
                    setLoading(false);
                    if (unsubscribe) unsubscribe();
                    return;
                }

                let userToUse = firebaseUser;

                // Only sign in anonymously if NO user is logged in at all
                if (!userToUse) {
                    try {
                        const credential = await signInAnonymously(auth);
                        userToUse = credential.user;
                    } catch (err) {
                        console.error("Anonymous sign-in failed:", err);
                        if (mounted) {
                            setSessionValid(false);
                            setInitializing(false);
                            setLoading(false);
                        }
                        return;
                    }
                }

                // Now initialize with the authenticated user
                await initSession(userToUse);

                // Unsubscribe after first auth state is handled
                if (unsubscribe) unsubscribe();
            });
        }

        return () => {
            mounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [eventId, token, attempt]);

    // Sign out of the real account and restart the flow as an anonymous door operator.
    const continueAsDoorOperator = async () => {
        try {
            setBlockedEmail(null);
            setInitializing(true);
            await signOut(auth);
            setAttempt(a => a + 1); // re-run the init effect (now with no user -> anonymous)
        } catch (err) {
            console.error('Door operator switch failed:', err);
            showToast('Impossibile passare alla modalità door', 'error');
        }
    };


    const loadGuests = async () => {
        try {
            setLoading(true);
            const fetchedGuests = await firestoreService.getGuests(eventId);
            // Sort: Checked in last? Or Name? Sort by Name.
            fetchedGuests.sort((a, b) => a.name.localeCompare(b.name));
            setGuests(fetchedGuests);
            setFilteredGuests(fetchedGuests);
        } catch (err) {
            console.error("Error loading guests:", err);
            showToast('Errore caricamento ospiti', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter guests
    useEffect(() => {
        const lowerSearch = search.toLowerCase().trim();
        if (!lowerSearch) {
            setFilteredGuests(guests);
        } else {
            setFilteredGuests(guests.filter(g =>
                g.name.toLowerCase().includes(lowerSearch) ||
                (g.listId && listNameMap[g.listId]?.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [search, guests, listNameMap]);

    const handleCheckIn = async (guest: Guest) => {
        try {
            const newStatus = !guest.checkedIn;
            const updatedGuest = {
                ...guest,
                checkedIn: newStatus,
                checkedInAt: newStatus ? new Date().toISOString() : undefined
            };

            // UI Optimistic Update
            setGuests(prev => prev.map(g => g.id === guest.id ? updatedGuest : g));

            // Backend Update
            await firestoreService.saveGuest(updatedGuest);

            // Feedback
            if (newStatus) {
                // Haptic feedback if available (mobile)
                if (navigator.vibrate) navigator.vibrate(50);
                showToast(`${guest.name} è entrato`, 'success');
            }
        } catch (err) {
            console.error("Check-in error:", err);
            showToast('Errore check-in', 'error');
            // Revert
            setGuests(prev => prev.map(g => g.id === guest.id ? guest : g));
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
                <p>Accesso Door System in corso...</p>
            </div>
        );
    }

    if (blockedEmail) {
        return (
            <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                    <User className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Sei già connesso</h2>
                <p className="max-w-sm mb-6">
                    Hai effettuato l'accesso come <span className="text-white font-medium">{blockedEmail}</span>.
                    Il check-in door usa un accesso dedicato: per continuare come operatore uscirai dal tuo account.
                    In alternativa, apri questo link in una finestra di navigazione in incognito.
                </p>
                <button
                    onClick={continueAsDoorOperator}
                    className="bg-brand-600 hover:brightness-110 text-white px-6 py-3 rounded-xl font-medium shadow-glow transition-all"
                >
                    Continua come operatore door
                </button>
            </div>
        );
    }

    if (!sessionValid) {
        return (
            <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Accesso Negato</h2>
                <p>Il link utilizzato non è valido o è scaduto.</p>
            </div>
        );
    }

    const checkedInCount = guests.filter(g => g.checkedIn).length;

    return (
        <div className="min-h-screen bg-ink-950 text-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-ink-900 border-b border-white/10 sticky top-0 z-20 px-4 py-3 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-lg">
                            <ClipboardCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Door Check-in</h1>
                            <p className="text-xs text-slate-400">{event?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Stats & Search */}
                <div className="flex gap-4 items-center mb-2">
                    <div className="flex-1 bg-white/5 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Entrati</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-white">{checkedInCount}</span>
                            <span className="text-sm text-slate-500">/ {guests.length}</span>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                // Refresh both lists (in case of new ones) and guests
                                const [fetchedLists, fetchedGuests] = await Promise.all([
                                    firestoreService.getLists(eventId),
                                    firestoreService.getGuests(eventId)
                                ]);
                                setLists(fetchedLists);
                                setGuests(fetchedGuests); // setGuests triggers filtering automatically via useEffect
                                showToast('Dati aggiornati', 'success');
                            } catch (error) {
                                console.error("Refresh error:", error);
                                showToast('Errore aggiornamento', 'error');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="p-3 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        title="Aggiorna dati"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Cerca ospite o lista..."
                        className="w-full bg-ink-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-all shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Guest List */}
            <div className="px-4 py-4 space-y-3">
                {filteredGuests.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nessun ospite trovato</p>
                    </div>
                ) : (
                    filteredGuests.map(guest => (
                        <div
                            key={guest.id}
                            className={`
                        relative overflow-hidden rounded-xl border transition-all duration-200
                        ${guest.checkedIn
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-ink-900 border-white/10 hover:border-white/10'}
                    `}
                        >
                            <div className="flex items-center p-4 gap-4">
                                {/* Status Icon */}
                                <div
                                    onClick={() => handleCheckIn(guest)}
                                    className={`
                                cursor-pointer flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                ${guest.checkedIn
                                            ? 'bg-emerald-500 text-slate-950 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                            : 'bg-white/5 text-slate-600 border border-white/10 hover:bg-white/10'}
                             `}
                                >
                                    {guest.checkedIn ? <Check className="w-6 h-6" strokeWidth={3} /> : <User className="w-6 h-6" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0" onClick={() => handleCheckIn(guest)}>
                                    <h3 className={`font-bold text-lg truncate ${guest.checkedIn ? 'text-emerald-400' : 'text-white'}`}>
                                        {guest.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                        {guest.isFemale !== null && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${guest.isFemale ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {guest.isFemale ? 'D' : 'U'}
                                            </span>
                                        )}
                                        {guest.tableId ? (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400">
                                                Tavolo
                                            </span>
                                        ) : (
                                            <span>
                                                {listNameMap[guest.listId] ? (
                                                    <>Lista <span className="text-white font-medium">{listNameMap[guest.listId]}</span></>
                                                ) : (
                                                    <span className="text-slate-500 italic">Lista sconosciuta</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {guest.tableId && (
                                        <p className="text-xs text-amber-500/70 mt-0.5 font-medium">
                                            Tavolo Privé
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Timestamp if checked in */}
                            {guest.checkedIn && guest.checkedInAt && (
                                <div className="bg-emerald-500/10 px-4 py-1 flex justify-end">
                                    <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
                                        Checked In: {new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CheckInPage;
