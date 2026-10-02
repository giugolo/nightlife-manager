import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, Loader2, Clock, Link2 } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { Invite } from '../types';

interface InviteModalProps {
    organizationId: string;
    userId: string;
    onClose: () => void;
    onInviteCreated: (invite: Invite) => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ organizationId, userId, onClose, onInviteCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invite, setInvite] = useState<Invite | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateInvite = async () => {
        setLoading(true);
        setError(null);

        try {
            const newInvite = await firestoreService.createInvite(organizationId, userId);
            setInvite(newInvite);
            onInviteCreated(newInvite);
        } catch (err: any) {
            console.error('Error creating invite:', err);
            setError('Errore nella creazione dell\'invito. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    const getInviteUrl = () => {
        if (!invite) return '';
        // SECURITY: ID is the token (prevents enumeration attacks)
        return `${window.location.origin}/invite/${invite.id}`;
    };

    const handleCopy = async () => {
        const url = getInviteUrl();
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatExpiryDate = (expiresAt: string) => {
        return new Date(expiresAt).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-ink-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Invita Staff</h2>
                            <p className="text-sm text-slate-400">Genera un link di invito</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!invite ? (
                        <div className="text-center">
                            <p className="text-slate-300 mb-6">
                                Genera un link di invito per aggiungere un nuovo membro staff alla tua organizzazione.
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                Lo staff avrà accesso a tutte le funzionalità eccetto la modifica dell'organizzazione.
                            </p>

                            {error && (
                                <p className="text-red-400 text-sm mb-4 bg-red-950/30 px-4 py-2 rounded-lg">{error}</p>
                            )}

                            <button
                                onClick={handleGenerateInvite}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Link2 className="w-5 h-5" />
                                        Genera Link Invito
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Success message */}
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="text-green-400 font-medium">Invito creato!</p>
                            </div>

                            {/* Link display */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Link di invito</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={getInviteUrl()}
                                        readOnly
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${copied
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Expiry info */}
                            <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 rounded-lg px-4 py-3">
                                <Clock className="w-4 h-4" />
                                <span>Scade il {formatExpiryDate(invite.expiresAt)}</span>
                            </div>

                            {/* Instructions */}
                            <p className="text-sm text-slate-500 text-center">
                                Condividi questo link con la persona che vuoi invitare. L'invito è valido per 7 giorni.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        {invite ? 'Chiudi' : 'Annulla'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
