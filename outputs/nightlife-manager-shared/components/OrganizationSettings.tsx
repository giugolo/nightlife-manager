import React, { useState, useEffect } from 'react';
import {
    Building2,
    ArrowLeft,
    Calendar,
    Users,
    UserCheck,
    Edit3,
    X,
    Check,
    Loader2,
    Crown,
    AlertCircle,
    Image,
    UserPlus,
    Link2,
    Trash2,
    Clock
} from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Invite } from '../types';
import InviteModal from './InviteModal';

interface OrganizationSettingsProps {
    onBack: () => void;
}

interface OrgStats {
    totalEvents: number;
    totalGuests: number;
    totalPRs: number;
}

interface OrgUser {
    uid: string;
    email: string;
    displayName?: string;
    role: string;
}

const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({ onBack }) => {
    const { organization, userProfile, refreshUserProfile } = useAuth();
    const [stats, setStats] = useState<OrgStats | null>(null);
    const [users, setUsers] = useState<OrgUser[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editLogoUrl, setEditLogoUrl] = useState('');
    const [logoValid, setLogoValid] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const MIN_NAME_LENGTH = 3;
    const isNameValid = editName.trim().length >= MIN_NAME_LENGTH;

    // Load organization data
    useEffect(() => {
        const loadData = async () => {
            if (!organization?.id) return;

            setLoading(true);

            // Load stats
            try {
                const statsData = await firestoreService.getOrganizationStats(organization.id);
                setStats(statsData);
            } catch (err) {
                console.error('Error loading organization stats:', err);
            }

            // Load users
            try {
                const usersData = await firestoreService.getOrganizationUsers(organization.id);
                setUsers(usersData);
            } catch (err) {
                console.error('Error loading organization users:', err);
            }

            // Load invites (only for admin/owner)
            if (userProfile?.role === 'admin' && organization.ownerId === userProfile.uid) {
                try {
                    const invitesData = await firestoreService.getOrganizationInvites(organization.id);
                    setInvites(invitesData);
                } catch (err) {
                    console.error('Error loading invites:', err);
                }
            }

            setLoading(false);
        };

        loadData();
    }, [organization?.id, userProfile?.role, userProfile?.uid, organization?.ownerId]);

    // Handle invite created
    const handleInviteCreated = (invite: Invite) => {
        setInvites(prev => [...prev, invite]);
    };

    // Handle delete invite
    const handleDeleteInvite = async (inviteId: string) => {
        setDeletingInviteId(inviteId);
        try {
            await firestoreService.deleteInvite(inviteId);
            setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        } catch (err) {
            console.error('Error deleting invite:', err);
        } finally {
            setDeletingInviteId(null);
        }
    };

    // Validate logo URL
    useEffect(() => {
        if (!editLogoUrl.trim()) {
            setLogoValid(null);
            return;
        }

        try {
            new URL(editLogoUrl);
        } catch {
            setLogoValid(false);
            return;
        }

        const img = new window.Image();
        img.onload = () => setLogoValid(true);
        img.onerror = () => setLogoValid(false);
        img.src = editLogoUrl;
    }, [editLogoUrl]);

    const startEditing = () => {
        setEditName(organization?.name || '');
        setEditLogoUrl(organization?.logoUrl || '');
        setIsEditing(true);
        setError(null);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setError(null);
    };

    const handleSave = async () => {
        if (!isNameValid || !organization) return;

        setSaving(true);
        setError(null);

        try {
            const updatedOrg: Organization = {
                ...organization,
                name: editName.trim(),
                logoUrl: editLogoUrl.trim() && logoValid ? editLogoUrl.trim() : undefined
            };

            await firestoreService.updateOrganization(updatedOrg);
            await refreshUserProfile(); // Refresh to get updated org
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating organization:', err);
            setError('Errore durante il salvataggio. Riprova.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-brand-500/20 text-brand-400';
            case 'staff':
                return 'bg-blue-500/20 text-blue-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };

    const isOwner = organization?.ownerId === userProfile?.uid;

    const formatInviteExpiry = (expiresAt: string) => {
        const expiry = new Date(expiresAt);
        const now = new Date();
        const isExpired = expiry < now;
        return {
            date: expiry.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
            isExpired
        };
    };

    if (!organization) {
        return (
            <div className="min-h-screen bg-ink-950 flex items-center justify-center">
                <div className="text-slate-400">Nessuna organizzazione trovata</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ink-950 text-slate-50 font-sans">
            {/* Header */}
            <header className="bg-ink-900 border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="font-bold text-xl">Impostazioni Organizzazione</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Organization Card */}
                <div className="bg-ink-900 border border-white/10 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden ring-2 ring-brand-500/20">
                                {organization.logoUrl ? (
                                    <img
                                        src={organization.logoUrl}
                                        alt={organization.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building2 className="w-10 h-10 text-slate-500" />
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{organization.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>Creata il {formatDate(organization.createdAt)}</span>
                                </div>
                                {organization.ownerId === userProfile?.uid && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs text-amber-400 font-medium">Proprietario</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Edit Button - Only show if user is owner */}
                        {isOwner && !isEditing && (
                            <button
                                onClick={startEditing}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Edit3 className="w-4 h-4" />
                                Modifica
                            </button>
                        )}
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                        <div className="border-t border-white/10 pt-6 mt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <h3 className="text-lg font-semibold text-white mb-4">Modifica Organizzazione</h3>

                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nome Organizzazione *
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        className={`w-full bg-white/5 border rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all ${editName.length > 0 && !isNameValid ? 'border-amber-500/50' : 'border-white/10'}`}
                                        placeholder="Nome del locale"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        disabled={saving}
                                    />
                                </div>
                                {editName.length > 0 && !isNameValid && (
                                    <p className="mt-2 text-sm text-amber-400 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Minimo {MIN_NAME_LENGTH} caratteri
                                    </p>
                                )}
                            </div>

                            {/* Logo URL Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Logo URL <span className="text-slate-500">(opzionale)</span>
                                </label>
                                <div className="relative">
                                    <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="url"
                                        className={`w-full bg-white/5 border rounded-lg pl-12 pr-10 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all ${logoValid === false ? 'border-red-500/50' : logoValid === true ? 'border-green-500/50' : 'border-white/10'}`}
                                        placeholder="https://example.com/logo.png"
                                        value={editLogoUrl}
                                        onChange={(e) => setEditLogoUrl(e.target.value)}
                                        disabled={saving}
                                    />
                                    {logoValid === true && (
                                        <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                                    )}
                                    {logoValid === false && (
                                        <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                                    )}
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">{error}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!isNameValid || saving}
                                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${isNameValid && !saving
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    Salva
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-ink-900 border border-white/10 rounded-xl p-6 animate-pulse">
                                <div className="h-4 bg-white/5 rounded w-20 mb-3" />
                                <div className="h-8 bg-white/5 rounded w-12" />
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="bg-ink-900 border border-white/10 rounded-xl p-6 hover:border-brand-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Calendar className="w-4 h-4 text-brand-400" />
                                    <span className="text-sm font-medium">Eventi Totali</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.totalEvents || 0}</p>
                            </div>

                            <div className="bg-ink-900 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-medium">Ospiti Totali</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.totalGuests || 0}</p>
                            </div>

                            <div className="bg-ink-900 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <UserCheck className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-medium">PR Totali</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{stats?.totalPRs || 0}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Users Section */}
                <div className="bg-ink-900 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            Utenti dell'Organizzazione
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-6">
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="w-10 h-10 bg-white/5 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-white/5 rounded w-32 mb-2" />
                                            <div className="h-3 bg-white/5 rounded w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                            Nessun utente trovato
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {users.map((user) => (
                                <div
                                    key={user.uid}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {user.displayName || 'Nome non disponibile'}
                                                {user.uid === organization.ownerId && (
                                                    <Crown className="w-4 h-4 text-amber-400 inline ml-2" />
                                                )}
                                            </p>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getRoleBadgeStyle(user.role)}`}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Invites Section - Only visible to owner */}
                {isOwner && (
                    <div className="bg-ink-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Link2 className="w-5 h-5 text-slate-400" />
                                Inviti Staff
                            </h3>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:brightness-110 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invita Staff
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-6">
                                <div className="h-4 bg-white/5 rounded w-48 animate-pulse" />
                            </div>
                        ) : invites.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Nessun invito creato</p>
                                <p className="text-xs mt-1">Clicca "Invita Staff" per creare un nuovo invito</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {invites.map((invite) => {
                                    const { date, isExpired } = formatInviteExpiry(invite.expiresAt);
                                    const isUsed = !!invite.usedBy;

                                    return (
                                        <div
                                            key={invite.id}
                                            className={`px-6 py-4 flex items-center justify-between ${isUsed || isExpired ? 'opacity-60' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUsed ? 'bg-green-500/20' : isExpired ? 'bg-red-500/20' : 'bg-brand-500/20'
                                                    }`}>
                                                    {isUsed ? (
                                                        <Check className="w-5 h-5 text-green-400" />
                                                    ) : isExpired ? (
                                                        <Clock className="w-5 h-5 text-red-400" />
                                                    ) : (
                                                        <Link2 className="w-5 h-5 text-brand-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm font-mono">
                                                        {invite.id.slice(0, 8)}...
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {isUsed ? (
                                                            <>Usato</>
                                                        ) : isExpired ? (
                                                            <>Scaduto il {date}</>
                                                        ) : (
                                                            <>Scade il {date}</>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isUsed && (
                                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">
                                                        Accettato
                                                    </span>
                                                )}
                                                {isExpired && !isUsed && (
                                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/20 text-red-400">
                                                        Scaduto
                                                    </span>
                                                )}
                                                {!isUsed && (
                                                    <button
                                                        onClick={() => handleDeleteInvite(invite.id)}
                                                        disabled={deletingInviteId === invite.id}
                                                        className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50"
                                                        title="Elimina invito"
                                                    >
                                                        {deletingInviteId === invite.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Invite Modal */}
            {showInviteModal && organization && userProfile && (
                <InviteModal
                    organizationId={organization.id}
                    userId={userProfile.uid}
                    onClose={() => setShowInviteModal(false)}
                    onInviteCreated={handleInviteCreated}
                />
            )}
        </div>
    );
};

export default OrganizationSettings;
