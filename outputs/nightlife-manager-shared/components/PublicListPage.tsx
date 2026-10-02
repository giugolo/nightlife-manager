import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { sendGuestConfirmation } from '../services/email';
import { Event, GuestList, Guest } from '../types';

interface PublicListPageProps {
    token: string;
    onBack?: () => void;
}

type RegistrationState = 'loading' | 'form' | 'success' | 'error' | 'closed';

const PublicListPage: React.FC<PublicListPageProps> = ({ token, onBack }) => {
    const [state, setState] = useState<RegistrationState>('loading');
    const [event, setEvent] = useState<Event | null>(null);
    const [list, setList] = useState<GuestList | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Countdown state
    const [timeRemaining, setTimeRemaining] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);
    const [closingDeadline, setClosingDeadline] = useState<Date | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isFemale, setIsFemale] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadListData();
    }, [token]);

    const loadListData = async () => {
        try {
            const result = await firestoreService.getListByPublicToken(token);

            if (!result) {
                setErrorMessage('Link non valido o lista non trovata.');
                setState('error');
                return;
            }

            const { list: foundList, event: foundEvent } = result;

            // Check if event date is in the past or within custom closing hours
            const eventDate = new Date(foundEvent.date);
            const now = new Date();
            const closingHours = foundEvent.listClosingHours ?? 6;
            const deadline = new Date(eventDate.getTime() - closingHours * 60 * 60 * 1000);
            setClosingDeadline(deadline);

            if (now >= deadline) {
                setEvent(foundEvent);
                setList(foundList);
                setErrorMessage('Le registrazioni per questo evento sono chiuse.');
                setState('closed');
                return;
            }

            // Note: We skip client-side capacity check as it requires authentication.
            // Capacity is enforced server-side during registration if needed.
            setEvent(foundEvent);
            setList(foundList);
            setState('form');
        } catch (error) {
            console.error('Error loading list:', error);
            setErrorMessage('Errore nel caricamento. Riprova più tardi.');
            setState('error');
        }
    };

    // Countdown timer effect
    useEffect(() => {
        if (!closingDeadline || state !== 'form') return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = closingDeadline.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining(null);
                setErrorMessage('Le registrazioni per questo evento sono chiuse.');
                setState('closed');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [closingDeadline, state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || isFemale === null) {
            return;
        }

        if (!event || !list) return;

        setIsSubmitting(true);

        try {
            const newGuest: Guest = {
                id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name.trim(),
                email: email.trim(),
                listId: list.id,
                eventId: event.id,
                isFemale,
                checkedIn: false
            };

            await firestoreService.saveGuest(newGuest);
            setState('success');

            // Invio email di conferma "fire-and-forget": un eventuale errore
            // (config mancante o problema di rete) NON deve impedire o annullare
            // la registrazione né cambiare lo stato di successo già impostato.
            try {
                await sendGuestConfirmation({
                    toEmail: email.trim(),
                    guestName: newGuest.name,
                    eventName: event.name,
                    eventDate: `${formatDate(event.date)} • ${formatTime(event.date)}`,
                    eventLocation: event.location,
                });
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
            }
        } catch (error) {
            console.error('Error registering:', error);
            setErrorMessage('Errore nella registrazione. Riprova.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Loading state
    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ink-950 via-brand-950 to-ink-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Caricamento...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (state === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ink-950 via-brand-950 to-ink-950 flex items-center justify-center p-4">
                <div className="bg-ink-900/70 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
                    <p className="text-slate-400 mb-6">{errorMessage}</p>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-brand-400 hover:text-brand-300 flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Torna indietro
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Closed state (time or capacity limit)
    if (state === 'closed') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ink-950 via-brand-950 to-ink-950 flex items-center justify-center p-4">
                <div className="bg-ink-900/70 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-amber-500/30">
                    <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Registrazioni Chiuse</h1>
                    {event && (
                        <div className="mb-4">
                            <p className="text-brand-400 font-semibold">{event.name}</p>
                            <p className="text-slate-500 text-sm">{formatDate(event.date)}</p>
                        </div>
                    )}
                    <p className="text-slate-400">{errorMessage}</p>
                </div>
            </div>
        );
    }

    // Success state
    if (state === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-ink-950 via-brand-950 to-ink-950 flex items-center justify-center p-4">
                <div className="bg-ink-900/70 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-green-500/30">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Sei in lista! 🎉</h1>
                    {event && list && (
                        <div className="mb-6 space-y-2">
                            <p className="text-brand-400 font-semibold text-lg">{event.name}</p>
                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(event.date)} • {formatTime(event.date)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-slate-400">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-4">
                                Lista: <span className="text-brand-400">{list.name}</span>
                            </p>
                        </div>
                    )}
                    <p className="text-slate-400 text-sm">
                        Riceverai una conferma all'indirizzo email indicato.
                    </p>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen bg-gradient-to-br from-ink-950 via-brand-950 to-ink-950 flex items-center justify-center p-4">
            <div className="bg-ink-900/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 max-w-md w-full ring-1 ring-white/10">
                {/* Event Header */}
                {event && (
                    <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.name}</h1>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-slate-400 text-sm">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                        {list && (
                            <p className="text-brand-400 mt-2">
                                Lista: <span className="font-semibold">{list.name}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Countdown Timer */}
                {timeRemaining && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6 ring-1 ring-white/10">
                        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-3">
                            <Clock className="w-4 h-4" />
                            <span>Le registrazioni chiudono tra:</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-ink-900/70 rounded-lg p-2">
                                <div className="text-2xl font-bold text-white">{String(timeRemaining.days).padStart(2, '0')}</div>
                                <div className="text-xs text-slate-500">giorni</div>
                            </div>
                            <div className="bg-ink-900/70 rounded-lg p-2">
                                <div className="text-2xl font-bold text-white">{String(timeRemaining.hours).padStart(2, '0')}</div>
                                <div className="text-xs text-slate-500">ore</div>
                            </div>
                            <div className="bg-ink-900/70 rounded-lg p-2">
                                <div className="text-2xl font-bold text-white">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                                <div className="text-xs text-slate-500">minuti</div>
                            </div>
                            <div className="bg-ink-900/70 rounded-lg p-2">
                                <div className="text-2xl font-bold text-amber-400 animate-pulse">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                                <div className="text-xs text-slate-500">secondi</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                            Nome e Cognome *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mario Rossi"
                            required
                            className="w-full px-4 py-3 bg-ink-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mario@email.com"
                            required
                            className="w-full px-4 py-3 bg-ink-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                        <p className="text-slate-500 text-xs mt-1">
                            Riceverai conferma e aggiornamenti sull'evento
                        </p>
                    </div>

                    {/* Gender Selection */}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                            Genere *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsFemale(false)}
                                className={`py-3 px-4 rounded-xl font-medium transition-all ${isFemale === false
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                    : 'bg-ink-950/60 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                ♂ Uomo
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFemale(true)}
                                className={`py-3 px-4 rounded-xl font-medium transition-all ${isFemale === true
                                    ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                                    : 'bg-ink-950/60 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                ♀ Donna
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || !email.trim() || isFemale === null}
                        className="w-full py-4 bg-brand-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-glow"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Registrazione...
                            </span>
                        ) : (
                            'Iscriviti in Lista'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    Gestito con Dioniso
                </p>
            </div>
        </div>
    );
};

export default PublicListPage;
