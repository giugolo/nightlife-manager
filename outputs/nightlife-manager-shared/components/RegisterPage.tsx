import React, { useState } from 'react';
import { Moon, Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input } from './ui';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const { register, error, loading, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password !== confirmPassword) {
            setLocalError('Le password non coincidono');
            return;
        }

        if (password.length < 6) {
            setLocalError('La password deve essere di almeno 6 caratteri');
            return;
        }

        try {
            // All new users are admin - they create their own organization
            await register(email, password, displayName, 'admin');
        } catch {
            // Error is handled in AuthContext
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative brand glow */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600 opacity-20 blur-[120px] rounded-full pointer-events-none" />
            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-glow">
                        <Moon className="text-white w-7 h-7" />
                    </div>
                    <h1 className="font-display font-bold text-3xl tracking-tight text-white">
                        Dioniso
                    </h1>
                </div>

                {/* Register Card */}
                <Card padding="lg" className="shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Crea Account</h2>
                    <p className="text-slate-400 mb-6">Registrati per creare la tua organizzazione</p>

                    {displayError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{displayError}</p>
                            <button onClick={() => { clearError(); setLocalError(null); }} className="ml-auto text-red-400 hover:text-red-300">×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nome Completo"
                            icon={User}
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Mario Rossi"
                            required
                        />
                        <Input
                            label="Email"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nome@esempio.it"
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Password"
                                icon={Lock}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••"
                                required
                            />
                            <Input
                                label="Conferma"
                                icon={Lock}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••"
                                required
                            />
                        </div>
                        <Button type="submit" fullWidth loading={loading} className="mt-6">
                            <UserPlus className="w-5 h-5" />
                            Registra
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Hai già un account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                            >
                                Accedi
                            </button>
                        </p>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Per unirti a un'organizzazione esistente, chiedi un invito all'admin.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default RegisterPage;
