import React, { useState } from 'react';
import { Moon, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input } from './ui';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const { login, error, loading, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch {
            // Error is handled in AuthContext
        }
    };

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

                {/* Login Card */}
                <Card padding="lg" className="shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Bentornato!</h2>
                    <p className="text-slate-400 mb-6">Accedi al tuo account per continuare</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                            <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-300">×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            icon={Mail}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nome@esempio.it"
                            required
                        />
                        <Input
                            label="Password"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <Button type="submit" fullWidth loading={loading}>
                            <LogIn className="w-5 h-5" />
                            Accedi
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Non hai un account?{' '}
                            <button
                                onClick={onSwitchToRegister}
                                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                            >
                                Registrati
                            </button>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
