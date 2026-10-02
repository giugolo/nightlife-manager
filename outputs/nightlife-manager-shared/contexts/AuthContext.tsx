import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Organization, Role } from '../types';

// Re-exported for backwards compatibility; `Role` in types.ts is the source of truth.
export type UserRole = Role;

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    role: Role;
    organizationId?: string;  // Multi-tenancy: l'org a cui appartiene l'utente
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    organization: Organization | null;     // Multi-tenancy: current organization
    needsOnboarding: boolean;              // Multi-tenancy: true se user non ha org
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    setOrganization: (org: Organization) => void;  // Per aggiornare org dopo onboarding
    refreshUserProfile: () => Promise<void>;       // Per ricaricare profilo dopo modifiche
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch organization data
    const fetchOrganization = async (orgId: string): Promise<Organization | null> => {
        try {
            const orgDoc = await getDoc(doc(db, 'organizations', orgId));
            if (orgDoc.exists()) {
                return { id: orgDoc.id, ...orgDoc.data() } as Organization;
            }
        } catch (err) {
            console.error('Error fetching organization:', err);
        }
        return null;
    };

    // Refresh user profile (called after onboarding)
    const refreshUserProfile = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const profile = userDoc.data() as UserProfile;
                setUserProfile(profile);

                // Fetch organization if user has one
                if (profile.organizationId) {
                    const org = await fetchOrganization(profile.organizationId);
                    setOrganization(org);
                    setNeedsOnboarding(false);
                } else if (profile.role === 'pending') {
                    // User registered via invite - don't trigger onboarding
                    setOrganization(null);
                    setNeedsOnboarding(false);
                } else {
                    setNeedsOnboarding(true);
                }
            }
        } catch (err) {
            console.error('Error refreshing user profile:', err);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch user profile from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const profile = userDoc.data() as UserProfile;
                        setUserProfile(profile);

                        // Multi-tenancy: Check if user has an organization
                        if (profile.organizationId) {
                            const org = await fetchOrganization(profile.organizationId);
                            setOrganization(org);
                            setNeedsOnboarding(false);
                        } else if (profile.role === 'pending') {
                            // User registered via invite but hasn't completed acceptance
                            // Don't show onboarding - they should complete invite flow
                            setOrganization(null);
                            setNeedsOnboarding(false);
                        } else {
                            // User needs to create or join an organization
                            setOrganization(null);
                            setNeedsOnboarding(true);
                        }
                    } else {
                        // Create default admin profile for first user
                        const newProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            role: 'admin'
                            // No organizationId - will trigger onboarding
                        };
                        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
                        setUserProfile(newProfile);
                        setOrganization(null);
                        setNeedsOnboarding(true);
                    }
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                }
            } else {
                setUserProfile(null);
                setOrganization(null);
                setNeedsOnboarding(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(getErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, displayName: string, role: UserRole) => {
        try {
            setError(null);
            setLoading(true);
            const credential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user profile in Firestore (without organizationId - will onboard later)
            const newProfile: UserProfile = {
                uid: credential.user.uid,
                email,
                displayName,
                role
            };
            await setDoc(doc(db, 'users', credential.user.uid), newProfile);
            setUserProfile(newProfile);
            setNeedsOnboarding(true);  // New users always need onboarding
        } catch (err: any) {
            setError(getErrorMessage(err.code));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
            setOrganization(null);
            setNeedsOnboarding(false);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const clearError = () => setError(null);

    const value: AuthContextType = {
        user,
        userProfile,
        organization,
        needsOnboarding,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        setOrganization,
        refreshUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Helper function to translate Firebase error codes to Italian
function getErrorMessage(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Email non valida';
        case 'auth/user-disabled':
            return 'Account disabilitato';
        case 'auth/user-not-found':
            return 'Utente non trovato';
        case 'auth/wrong-password':
            return 'Password errata';
        case 'auth/email-already-in-use':
            return 'Email già in uso';
        case 'auth/weak-password':
            return 'Password troppo debole (min. 6 caratteri)';
        case 'auth/invalid-credential':
            return 'Credenziali non valide';
        default:
            return 'Errore di autenticazione';
    }
}
