import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, ArrowRight, ArrowLeft, Loader2, Image, Check, AlertCircle } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Organization } from '../types';

interface OnboardingModalProps {
    onComplete: () => void;
}

type Step = 'input' | 'preview';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const { user, refreshUserProfile } = useAuth();
    const [orgName, setOrgName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoValid, setLogoValid] = useState<boolean | null>(null);
    const [step, setStep] = useState<Step>('input');
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [migrationResult, setMigrationResult] = useState<{ events: number; guests: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const MIN_NAME_LENGTH = 3;
    const isNameValid = orgName.trim().length >= MIN_NAME_LENGTH;

    // Validate logo URL when it changes
    useEffect(() => {
        if (!logoUrl.trim()) {
            setLogoValid(null);
            return;
        }

        // Check if URL looks valid
        try {
            new URL(logoUrl);
        } catch {
            setLogoValid(false);
            return;
        }

        // Try to load the image
        const img = new window.Image();
        img.onload = () => setLogoValid(true);
        img.onerror = () => setLogoValid(false);
        img.src = logoUrl;
    }, [logoUrl]);

    const handleCreateOrganization = async () => {
        if (!isNameValid || !user) return;

        setLoading(true);
        setError(null);

        try {
            // SAFETY CHECK: Don't overwrite if user already has an organization
            const existingProfile = await firestoreService.getUserProfile(user.uid);
            if (existingProfile?.organizationId) {
                console.warn('User already has organization, skipping creation');
                await refreshUserProfile();
                onComplete();
                return;
            }

            // Generate unique organization ID
            const orgId = firestoreService.generateOrganizationId();

            // Create organization with optional logo
            const newOrg: Organization = {
                id: orgId,
                name: orgName.trim(),
                ownerId: user.uid,
                createdAt: new Date().toISOString(),
                ...(logoUrl.trim() && logoValid ? { logoUrl: logoUrl.trim() } : {})
            };

            await firestoreService.createOrganization(newOrg);

            // Update user profile with organizationId
            await firestoreService.updateUserOrganization(user.uid, orgId);

            // Migrate legacy data (for existing users like edoardougolotti@protonmail.ch)
            setMigrating(true);
            try {
                const result = await firestoreService.migrateLegacyData(orgId);
                if (result.migratedEvents > 0) {
                    setMigrationResult({ events: result.migratedEvents, guests: result.migratedGuests });
                    // Wait a moment to show migration result
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (migrationErr) {
                console.error('Migration error (non-blocking):', migrationErr);
                // Migration errors are non-blocking - user can still proceed
            }
            setMigrating(false);

            // Refresh user profile to update context
            await refreshUserProfile();

            // Notify parent that onboarding is complete
            onComplete();
        } catch (err: any) {
            console.error('Error creating organization:', err);
            setError('Errore durante la creazione. Riprova.');
            setStep('input'); // Go back to input on error
        } finally {
            setLoading(false);
            setMigrating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isNameValid && step === 'input') {
            setStep('preview');
        }
    };

    const goToPreview = () => {
        if (isNameValid) {
            setStep('preview');
        }
    };

    const goBackToInput = () => {
        setStep('input');
    };

    return (
        <div className="fixed inset-0 bg-ink-950 z-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative bg-ink-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 pt-6">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 'input' ? 'bg-brand-500 w-6' : 'bg-white/10'}`} />
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 'preview' ? 'bg-brand-500 w-6' : 'bg-white/10'}`} />
                </div>

                {/* Content with transition */}
                <div className="relative">
                    {/* Input Step */}
                    <div className={`p-8 transition-all duration-300 ease-out ${step === 'input' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'}`}>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600/20 rounded-2xl mb-4">
                                <Sparkles className="w-8 h-8 text-brand-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Benvenuto in Dioniso!</h2>
                            <p className="text-slate-400">
                                Per iniziare, crea la tua organizzazione.
                            </p>
                        </div>

                        {/* Form */}
                        <div className="space-y-5">
                            {/* Organization Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nome del Locale *
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all ${orgName.length > 0 && !isNameValid ? 'border-amber-500/50' : 'border-white/10'}`}
                                        placeholder="Es. Club Paradiso, Discoteca XYZ..."
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                                {orgName.length > 0 && !isNameValid && (
                                    <p className="mt-2 text-sm text-amber-400 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Minimo {MIN_NAME_LENGTH} caratteri ({orgName.length}/{MIN_NAME_LENGTH})
                                    </p>
                                )}
                            </div>

                            {/* Logo URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Logo URL <span className="text-slate-500">(opzionale)</span>
                                </label>
                                <div className="relative">
                                    <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="url"
                                        className={`w-full bg-white/5 border rounded-xl pl-12 pr-10 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all ${logoValid === false ? 'border-red-500/50' : logoValid === true ? 'border-green-500/50' : 'border-white/10'}`}
                                        placeholder="https://example.com/logo.png"
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        disabled={loading}
                                    />
                                    {logoValid === true && (
                                        <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                                    )}
                                    {logoValid === false && (
                                        <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                {logoValid === false && (
                                    <p className="mt-2 text-sm text-red-400">URL immagine non valido</p>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">{error}</p>
                            )}

                            <button
                                onClick={goToPreview}
                                disabled={!isNameValid}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${isNameValid
                                    ? 'bg-brand-600 hover:brightness-110 text-white shadow-lg shadow-brand-900/30 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Anteprima
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Footer note */}
                        <p className="mt-6 text-xs text-slate-500 text-center">
                            * Campo obbligatorio
                        </p>
                    </div>

                    {/* Preview Step */}
                    <div className={`p-8 transition-all duration-300 ease-out ${step === 'preview' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'}`}>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-white mb-2">Conferma la tua organizzazione</h2>
                            <p className="text-slate-400 text-sm">
                                Ecco come apparirà il tuo locale
                            </p>
                        </div>

                        {/* Preview Card */}
                        <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-6 mb-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center text-center">
                                {/* Logo Preview */}
                                <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center mb-4 overflow-hidden ring-4 ring-brand-500/20 animate-pulse">
                                    {logoUrl.trim() && logoValid ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Building2 className="w-12 h-12 text-slate-500" />
                                    )}
                                </div>

                                {/* Organization Name */}
                                <h3 className="text-2xl font-bold text-white mb-1">{orgName.trim()}</h3>
                                <p className="text-slate-400 text-sm">La tua nuova organizzazione</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={goBackToInput}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Modifica
                            </button>
                            <button
                                onClick={handleCreateOrganization}
                                disabled={loading}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${!loading
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-green-800 text-green-300 cursor-wait'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {migrating ? (
                                            migrationResult ? (
                                                <span className="text-sm">Migrati {migrationResult.events} eventi...</span>
                                            ) : (
                                                <span className="text-sm">Migrazione...</span>
                                            )
                                        ) : (
                                            <span className="text-sm">Creazione...</span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Conferma
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Footer note */}
                        <p className="mt-6 text-xs text-slate-500 text-center">
                            Potrai modificare questi dati in seguito dalle impostazioni.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
