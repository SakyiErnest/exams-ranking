'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    UserCredential,
    User
} from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserCredential>;
    signup: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { throw new Error('Not implemented'); },
    signup: async () => { throw new Error('Not implemented'); },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const { auth } = getFirebase();
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string): Promise<UserCredential> => {
        if (typeof window === 'undefined') throw new Error('Cannot login on server side');

        const { auth } = getFirebase();
        if (!auth) throw new Error('Auth not initialized');

        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (email: string, password: string): Promise<UserCredential> => {
        if (typeof window === 'undefined') throw new Error('Cannot signup on server side');

        const { auth } = getFirebase();
        if (!auth) throw new Error('Auth not initialized');

        try {
            return await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = async () => {
        if (typeof window === 'undefined') return;

        const { auth } = getFirebase();
        if (!auth) return;

        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);