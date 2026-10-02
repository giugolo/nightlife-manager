import React, { useState, useEffect, useRef } from 'react';
import { Moon, UserPlus, Check, AlertCircle, Loader2, ArrowLeft, PartyPopper, Mail, Lock, User, LogIn } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Invite } from '../types';

interface InviteAcceptPageProps {
    token: string;
    onBack: () => void;
}

const InviteAcceptPage: React.FC<InviteAcceptPageProps> = ({ token, onBack }) => {
    const { user, userProfile, refreshUserProfile, login, register, error: authError, loading: authLoading, clearError } = useAuth();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [orgName, setOrgName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref to prevent double execution
    const acceptingRef = useRef(false);

    // Auth form state
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Load invite details
    useEffect(() => {
        const loadInvite = async () => {
            try {
                const foundInvite = await firestoreService.getInviteByToken(token);

                if (!foundInvite) {
                    setError('Invito non trovato. Il link potrebbe essere errato o l\'invito è stato eliminato.');
                    setLoading(false);
                    return;
                }

                // Check if already used
                if (foundInvite.usedBy) {
                    // Check if the current user used it
                    if (user && foundInvite.usedBy === user.uid) {
                        // User already accepted this invite - show success
                        setAccepted(true);
                        setInvite(foundInvite);
                        // Load org name
                        const org = await firestoreService.getOrganization(foundInvite.organizationId);
                        if (org) setOrgName(org.name);
                        setLoading(false);
                        // Redirect to home
                        setTimeout(() => {
                            onBack();
                        }, 2000);
                        return;
                    }
                    setError('Questo invito è già stato utilizzato.');
                    setLoading(false);
                    return;
                }

                // Check expiry
                if (new Date(foundInvite.expiresAt) < new Date()) {
                    setError('Questo invito è scaduto.');
                    setLoading(false);
                    return;
                }

                setInvite(foundInvite);

                // Load organization name
                const org = await firestoreService.getOrganization(foundInvite.organizationId);
                if (org) {
                    setOrgName(org.name);
                }
            } catch (err) {
                console.error('Error loading invite:', err);
                setError('Errore nel caricamento dell\'invito.');
            } finally {
                setLoading(false);
            }
        };

        loadInvite();
    }, [token, user]);

    // Effect to detect if user is already in the organization (post-registration success)
    useEffect(() => {
        if (user && userProfile?.organizationId && invite) {
            // User is already in the organization - this means the invite was accepted
            if (userProfile.organizationId === invite.organizationId) {
                setAccepted(true);
                setTimeout(() => {
                    onBack();
                }, 2000);
            }
        }
    }, [user, userProfile, invite]);

    const handleAccept = async () => {
        if (!invite || !user) return;

        // Prevent double execution
        if (acceptingRef.current) return;
        acceptingRef.current = true;

        // If user already belongs to THIS organization, show success
        if (userProfile?.organizationId === invite.organizationId) {
            setAccepted(true);
            setTimeout(() => {
                onBack();
            }, 2000);
            return;
        }

        // If user already belongs to a DIFFERENT organization, show error
        if (userProfile?.organizationId && userProfile.organizationId !== invite.organizationId) {
            setError('Fai già parte di un\'organizzazione. Effettua il logout e usa un altro account per accettare questo invito.');
            acceptingRef.current = false;
            return;
        }

        setAccepting(true);
        setError(null);

        try {
            await firestoreService.acceptInvite(invite.id, user.uid);
            setAccepted(true);

            // Refresh user profile to pick up new organizationId
            await refreshUserProfile();

            // Redirect to home after 2 seconds
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (err: any) {
            console.error('Error accepting invite:', err);

            // Check if the error is because the invite was already used by this user
            // This can happen due to React Strict Mode double-rendering
            try {
                await refreshUserProfile();
                // If after refresh the user is in the org, consider it success
                if (userProfile?.organizationId === invite.organizationId) {
                    setAccepted(true);
                    setTimeout(() => {
                        onBack();
                    }, 2000);
                    return;
                }
            } catch {
                // Ignore refresh errors
            }

            setError(err.message || 'Errore nell\'accettazione dell\'invito.');
        } finally {
            setAccepting(false);
            acceptingRef.current = false;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();
        try {
            await login(email, password);
            // After login, the component will re-render with user set
        } catch {
            // Error handled by AuthContext
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        if (password !== confirmPassword) {
            setLocalError('Le password non coincidono');
            return;
        }

        if (password.length < 6) {
            setLocalError('La password deve essere di almeno 6 caratteri');
            return;
        }

        try {
            // Register WITHOUT role - the role will be assigned when accepting the invite
            // We pass 'pending' as role to indicate they need to accept an invite
            await register(email, password, displayName, 'pending');
            // After registration, the component will re-render with user set
        } catch {
            // Error handled by AuthContext
        }
    };

    const displayError = localError || authError;

    if (loading) {
        return (
            <div className="min-h-screen bg-ink-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/30">
                        <Moon className="text-white w-7 h-7" />
                    </div>
                    <h1 className="font-bold text-3xl tracking-tight text-white">
                        Dioniso
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-ink-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {accepted ? (
                        // Success state
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PartyPopper className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Benvenuto!</h2>
                            <p className="text-slate-400 mb-4">
                                Ora fai parte di <span className="text-white font-medium">{orgName}</span>.
                            </p>
                            <p className="text-sm text-slate-500">Reindirizzamento in corso...</p>
                        </div>
                    ) : error ? (
                        // Error state
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Invito non valido</h2>
                            <p className="text-slate-400 mb-6">{error}</p>
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Torna alla Home
                            </button>
                        </div>
                    ) : !user ? (
                        // Not logged in - show inline login/register form
                        <div>
                            {/* Invite header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-brand-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Invito Staff</h2>
                                <p className="text-slate-400">
                                    Sei stato invitato a unirti a <span className="text-white font-medium">{orgName}</span>
                                </p>
                            </div>

                            {/* Auth mode tabs */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${authMode === 'login'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white/5 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Accedi
                                </button>
                                <button
                                    onClick={() => setAuthMode('register')}
                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${authMode === 'register'
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-white/5 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Registrati
                                </button>
                            </div>

                            {displayError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{displayError}</p>
                                    <button
                                        onClick={() => { clearError(); setLocalError(null); }}
                                        className="ml-auto text-red-400 hover:text-red-300"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {authMode === 'login' ? (
                                // Login form
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="nome@esempio.it"
                                                className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full bg-brand-600 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {authLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <LogIn className="w-5 h-5" />
                                                Accedi e Continua
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                // Register form
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="Mario Rossi"
                                                className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="nome@esempio.it"
                                                className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••"
                                                    className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Conferma</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••"
                                                    className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full bg-brand-600 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {authLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                Registrati e Continua
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        // Accept invite state (user is logged in)
                        <div className="text-center">
                            <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="w-8 h-8 text-brand-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Invito Staff</h2>
                            <p className="text-slate-400 mb-6">
                                Sei stato invitato a unirti a <span className="text-white font-medium">{orgName}</span> come staff.
                            </p>

                            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm text-slate-300 mb-2">Come staff potrai:</p>
                                <ul className="text-sm text-slate-400 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" /> Creare e gestire eventi
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" /> Gestire ospiti e liste
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" /> Gestire check-in
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={handleAccept}
                                disabled={accepting}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                            >
                                {accepting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Accetta Invito
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-slate-500 mt-4">
                                Loggato come {user.email}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteAcceptPage;
