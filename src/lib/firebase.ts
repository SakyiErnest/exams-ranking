// src/lib/firebase.ts (or your path)
// --- Corrected Version with 'unknown' in catch blocks ---

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth'; // Removed unused UserCredential
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// --- Configuration ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase config is missing essential keys (apiKey, projectId). Firebase might not initialize correctly.");
}

// --- Type Definition for Returned Services ---
interface FirebaseServices {
    app: FirebaseApp | undefined;
    auth: Auth | undefined;
    db: Firestore | undefined;
    analytics: Analytics | undefined;
    googleProvider: GoogleAuthProvider | undefined;
}

// --- Singleton Instance Storage ---
let services: FirebaseServices | null = null;

// --- Emulator Configuration ---
const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST || 'localhost'; // Allow overriding host
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;

/**
 * Initializes Firebase services on the client-side using a singleton pattern.
 * Optionally connects to Firebase Emulators.
 * @returns {FirebaseServices} Object containing initialized Firebase service instances.
 */
export function getFirebase(): FirebaseServices {
    if (typeof window === 'undefined') {
        // Return empty services object on server-side
        return { app: undefined, auth: undefined, db: undefined, analytics: undefined, googleProvider: undefined };
    }
    if (services) {
        // Return existing services if already initialized
        return services;
    }

    try {
        const existingApp = getApps().length ? getApp() : null;
        const app = existingApp || initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const googleProvider = new GoogleAuthProvider();
        let analytics: Analytics | undefined = undefined;

        if (USE_EMULATORS) {
            console.warn('Connecting to Firebase Emulators...');
            try {
                // Connect Auth Emulator
                connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, { disableWarnings: false }); // Keep warnings unless problematic
                console.log(`Auth Emulator connected: http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`);
            } catch (e: unknown) { // <-- Use unknown
                // Check if it's an Error-like object with a 'code' property
                const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code: unknown }).code : undefined;
                if (code !== 'auth/emulator-config-failed') { // Ignore already connected error
                    console.error('Auth Emulator connection error:', e);
                } else {
                    console.log('Auth Emulator already configured.'); // More informative log
                }
            }
            try {
                // Connect Firestore Emulator
                connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
                console.log(`Firestore Emulator connected: http://${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`);
            } catch (e: unknown) { // <-- Use unknown
                // Check if it's an Error-like object with a 'message' possibly indicating already running
                const message = e instanceof Error ? e.message : String(e);
                if (!message.includes('already running')) { // Heuristic check for Firestore already connected
                     console.error('Firestore Emulator connection error:', e);
                } else {
                     console.log('Firestore Emulator already configured.'); // More informative log
                }
            }
        }

        // Set Auth Persistence
        setPersistence(auth, browserLocalPersistence)
            .catch(error => { // error is implicitly Error here based on TS lib types for Promise reject
                console.error('Firebase Auth: Error setting persistence:', error.code, error.message);
            });

        // Initialize Analytics (Async)
        isSupported()
            .then(supported => {
                if (supported) {
                    analytics = getAnalytics(app);
                    // Assign to singleton after creation
                    if (services) { services.analytics = analytics; }
                    console.log('Firebase Analytics initialized.');
                } else {
                    console.log('Firebase Analytics is not supported in this environment.');
                }
            })
            .catch(error => { // error is implicitly Error
                console.error('Firebase Analytics: Error checking support or initializing:', error);
            });

        // Store services in singleton
        services = { app, auth, db, analytics, googleProvider };

        if (!existingApp) {
            console.log('Firebase initialized successfully.');
        } else {
            console.log('Firebase using existing app instance.');
        }

    } catch (error: unknown) { // <-- Use unknown for main initialization catch
        console.error('Firebase Core: Initialization failed.'); // Simplified initial log
        let message = 'An unexpected error occurred during Firebase initialization.';
        let code: string | undefined = undefined;

        // Extract message and code safely
        if (error instanceof Error) {
            message = error.message;
            if ('code' in error && typeof (error as Record<string, unknown>).code === 'string') {
                code = (error as Record<string, string>).code;
            }
        } else if (typeof error === 'string') {
            message = error;
        }

        // Log extracted details
        console.error(`Error Details: ${message}${code ? ` (Code: ${code})` : ''}`);
        console.error("Original Error Object:", error); // Log the full object for debugging

        // Return empty services on failure
        return { app: undefined, auth: undefined, db: undefined, analytics: undefined, googleProvider: undefined };
    }

    return services;
}

// Removed deprecated direct exports

// Export auth and firestore instances
export const auth = getAuth(initializeApp(firebaseConfig));
export const db = getFirestore(initializeApp(firebaseConfig));