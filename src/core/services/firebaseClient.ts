import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY = 'nona_firebase_config';

/**
 * Reads Firebase configuration with priority:
 * 1. LocalStorage (custom user configuration in Settings or AuthModal)
 * 2. Vite environment variables (VITE_FIREBASE_*)
 */
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {}

  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (envProjectId ? `${envProjectId}.firebaseapp.com` : undefined);

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: envAuthDomain || '',
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  resetFirebase();
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  resetFirebase();
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export function resetFirebase(): void {
  cachedApp = null;
  cachedAuth = null;
}

/**
 * Returns the initialized FirebaseApp instance if valid config exists.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp;

  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(config);
    }
    return cachedApp;
  } catch (err) {
    console.warn('[Firebase] Error al inicializar Firebase App:', err);
    return null;
  }
}

/**
 * Returns the Firebase Auth instance if Firebase is configured.
 */
export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn('[Firebase] Error al obtener Firebase Auth:', err);
    return null;
  }
}
