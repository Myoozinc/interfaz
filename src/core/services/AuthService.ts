import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './firebaseClient';
import type { UserAccount } from '../../types';

export class AuthService {
  private static instance: AuthService | null = null;
  private currentUser: UserAccount | null = null;
  private listeners: ((user: UserAccount | null) => void)[] = [];

  private constructor() {
    this.initAuthListener();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initAuthListener() {
    const auth = getFirebaseAuth();
    if (auth) {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          this.currentUser = this.mapFirebaseUser(firebaseUser);
        } else {
          // If no firebase user, check local storage or reset
          const saved = localStorage.getItem('nona_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.provider === 'local') {
                this.currentUser = parsed;
              } else {
                this.currentUser = null;
              }
            } catch {
              this.currentUser = null;
            }
          } else {
            this.currentUser = null;
          }
        }
        this.notifyListeners();
      });
    } else {
      // Offline / Local storage fallback
      const saved = localStorage.getItem('nona_user');
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved);
        } catch {
          this.currentUser = null;
        }
      }
    }
  }

  public subscribe(callback: (user: UserAccount | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public mapFirebaseUser(user: FirebaseUser): UserAccount {
    const providerId = user.providerData[0]?.providerId || 'email';
    let provider: UserAccount['provider'] = 'email';
    if (providerId.includes('google')) provider = 'google';
    else if (providerId.includes('github')) provider = 'github';

    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Usuario',
      email: user.email || '',
      avatar: user.photoURL || undefined,
      provider,
    };
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  /**
   * Register with Email & Password
   */
  public async signUpWithEmail(email: string, pass: string, name: string): Promise<UserAccount> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Configura tu proyecto Firebase primero.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const user = this.mapFirebaseUser(cred.user);
      if (name.trim()) user.name = name.trim();
      this.currentUser = user;
      localStorage.setItem('nona_user', JSON.stringify(user));
      this.notifyListeners();
      return user;
    } catch (err: any) {
      throw new Error(this.translateError(err));
    }
  }

  /**
   * Sign In with Email & Password
   */
  public async signInWithEmail(email: string, pass: string): Promise<UserAccount> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Configura tu proyecto Firebase primero.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = this.mapFirebaseUser(cred.user);
      this.currentUser = user;
      localStorage.setItem('nona_user', JSON.stringify(user));
      this.notifyListeners();
      return user;
    } catch (err: any) {
      throw new Error(this.translateError(err));
    }
  }

  /**
   * Sign In with Google Popup
   */
  public async signInWithGoogle(): Promise<UserAccount> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Configura tu proyecto Firebase primero.');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = this.mapFirebaseUser(cred.user);
      this.currentUser = user;
      localStorage.setItem('nona_user', JSON.stringify(user));
      this.notifyListeners();
      return user;
    } catch (err: any) {
      throw new Error(this.translateError(err));
    }
  }

  /**
   * Sign In with GitHub Popup
   */
  public async signInWithGithub(): Promise<UserAccount> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Configura tu proyecto Firebase primero.');
    }

    try {
      const provider = new GithubAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = this.mapFirebaseUser(cred.user);
      this.currentUser = user;
      localStorage.setItem('nona_user', JSON.stringify(user));
      this.notifyListeners();
      return user;
    } catch (err: any) {
      throw new Error(this.translateError(err));
    }
  }

  /**
   * Send Password Reset Email
   */
  public async sendPasswordReset(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Configura tu proyecto Firebase primero.');
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(this.translateError(err));
    }
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[AuthService] Error al cerrar sesión en Firebase:', err);
      }
    }
    this.currentUser = null;
    localStorage.removeItem('nona_user');
    this.notifyListeners();
  }

  /**
   * Local Guest / Offline login
   */
  public setGuestSession(name: string = 'Invitado'): UserAccount {
    const guest: UserAccount = {
      id: `guest_${Date.now()}`,
      name: name.trim() || 'Invitado',
      email: '',
      provider: 'local',
    };
    this.currentUser = guest;
    localStorage.setItem('nona_user', JSON.stringify(guest));
    this.notifyListeners();
    return guest;
  }

  public isConfigured(): boolean {
    return isFirebaseConfigured();
  }

  /**
   * Human-friendly error translation in Spanish
   */
  public translateError(error: any): string {
    const code = error?.code || '';
    const message = error?.message || '';

    switch (code) {
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido inhabilitada temporalmente.';
      case 'auth/user-not-found':
        return 'No existe ninguna cuenta registrada con este correo.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Contraseña o credencial incorrecta. Verifica tus datos.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este correo electrónico.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'La ventana emergente de inicio de sesión fue cerrada antes de completar el proceso.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Permite ventanas emergentes para continuar.';
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado en Firebase. Agrega tu dominio (ej: localhost o tu URL de Vercel) en Firebase Console > Authentication > Settings > Authorized domains.';
      case 'auth/operation-not-allowed':
        return 'Este proveedor de autenticación no está habilitado en tu consola de Firebase.';
      case 'auth/network-request-failed':
        return 'Error de red o conexión a internet inestable.';
      default:
        return message || 'Ocurrió un error inesperado durante la autenticación.';
    }
  }
}

export const authService = AuthService.getInstance();
