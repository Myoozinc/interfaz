import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  KeyRound,
  User,
  LogOut,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import type { UserAccount } from '../types';
import { NonaLogo } from './NonaLogo';
import { authService } from '../core/services/AuthService';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  isFirebaseConfigured, 
  type FirebaseConfig 
} from '../core/services/firebaseClient';
import { telemetryService } from '../services/telemetryService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Firebase Config State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
  const [hasFirebaseConfig, setHasFirebaseConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const configured = isFirebaseConfigured();
      setHasFirebaseConfig(configured);
      if (!configured) {
        const existing = getFirebaseConfig();
        if (existing) {
          setFirebaseApiKey(existing.apiKey || '');
          setFirebaseProjectId(existing.projectId || '');
          setFirebaseAuthDomain(existing.authDomain || '');
        }
      }
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsResettingPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseApiKey.trim() || !firebaseProjectId.trim()) {
      setErrorMessage('Ingresa al menos la API Key y el Project ID de Firebase.');
      return;
    }

    const cfg: FirebaseConfig = {
      apiKey: firebaseApiKey.trim(),
      projectId: firebaseProjectId.trim(),
      authDomain: firebaseAuthDomain.trim() || `${firebaseProjectId.trim()}.firebaseapp.com`,
    };

    saveFirebaseConfig(cfg);
    setHasFirebaseConfig(true);
    setIsConfigOpen(false);
    setSuccessMessage('¡Configuración de Firebase guardada con éxito!');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasFirebaseConfig) {
      setIsConfigOpen(true);
      setErrorMessage('Primero conecta tu proyecto Firebase o entra como Invitado.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const user = await authService.signUpWithEmail(email, password, name);
        onLogin(user);
        telemetryService.trackEvent('auth_signup', 'Nueva cuenta registrada en Firebase', {
          uid: user.id,
          email: user.email,
          name: user.name,
        });
        setSuccessMessage('¡Cuenta creada e inicio de sesión exitoso!');
      } else {
        const user = await authService.signInWithEmail(email, password);
        onLogin(user);
        telemetryService.trackEvent('auth_login', 'Inicio de sesión con correo en Firebase', {
          uid: user.id,
          email: user.email,
          name: user.name,
        });
        setSuccessMessage('¡Bienvenido de vuelta!');
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasFirebaseConfig) {
      setIsConfigOpen(true);
      setErrorMessage('Configura tu proyecto Firebase para habilitar inicio de sesión.');
      return;
    }

    setLoading(true);
    try {
      let user: UserAccount;
      if (provider === 'google') {
        user = await authService.signInWithGoogle();
      } else {
        user = await authService.signInWithGithub();
      }
      onLogin(user);
      telemetryService.trackEvent('auth_social_login', `Inicio de sesión con ${provider}`, {
        uid: user.id,
        email: user.email,
        name: user.name,
        provider,
      });
      setSuccessMessage(`¡Autenticado con ${provider === 'google' ? 'Google' : 'GitHub'}!`);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || `Error al iniciar sesión con ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Ingresa tu correo electrónico para enviarte el enlace de restablecimiento.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.sendPasswordReset(email);
      setSuccessMessage('Te enviamos un correo con las instrucciones para restablecer tu contraseña.');
      setIsResettingPassword(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guest = authService.setGuestSession(name || 'Invitado');
    onLogin(guest);
    telemetryService.trackEvent('auth_guest', 'Acceso como invitado');
    onClose();
  };

  const handleLogoutAction = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      onLogout();
      telemetryService.trackEvent('auth_logout', 'Cierre de sesión');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cerrar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div 
        role="dialog" 
        aria-modal="true" 
        className="bg-panel border border-line rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs"
      >
        {/* Header */}
        <div className="p-6 bg-canvas border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <NonaLogo size={32} variant="badge" />
            <div>
              <h2 className="text-base font-extrabold text-fg tracking-tight">
                {currentUser && currentUser.provider !== 'local'
                  ? 'Perfil de Usuario' 
                  : isResettingPassword 
                    ? 'Recuperar Contraseña'
                    : isRegister 
                      ? 'Crear Cuenta NONA' 
                      : 'Iniciar Sesión'}
              </h2>
              <p className="text-xs text-muted">
                {currentUser && currentUser.provider !== 'local'
                  ? 'Autenticado con Firebase Auth' 
                  : 'Sincroniza tus proyectos y administra tus apps'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl hover:bg-raised text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User Already Logged In */}
          {currentUser && currentUser.provider !== 'local' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-4 bg-canvas border border-line rounded-2xl">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-12 h-12 rounded-full border border-line object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-sm text-fg truncate block">{currentUser.name}</span>
                  <span className="text-xs text-muted truncate block">{currentUser.email || 'Sin correo asociado'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-md border border-emerald-500/20">
                      Firebase: {currentUser.provider}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      ID: {currentUser.id.slice(0, 10)}…
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-accent/10 border border-accent/25 rounded-2xl text-fg-2 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tu sesión está activa en NONA. Las apps generadas y tus preferencias se sincronizan de forma segura.
                </p>
              </div>

              <button
                onClick={handleLogoutAction}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : isResettingPassword ? (
            /* Reset Password Form */
            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <p className="text-muted leading-relaxed">
                Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña con Firebase.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-fg-2 block mb-1">Correo Electrónico</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-muted absolute left-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-canvas border border-line rounded-xl text-xs outline-none focus:border-accent focus:bg-panel text-fg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-accent hover:bg-accent-strong text-accent-ink hover:text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Enviar enlace de recuperación</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResettingPassword(false)}
                className="w-full text-center text-xs text-muted hover:text-fg pt-1 cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </form>
          ) : (
            /* Sign In / Sign Up Form */
            <div className="space-y-4">
              
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-canvas hover:bg-raised border border-line font-bold text-fg-2 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-fg/20"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-canvas hover:bg-raised border border-line font-bold text-fg-2 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-fg/20"
                >
                  <svg className="w-4 h-4 fill-current text-fg" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-muted text-[10px]">
                <div className="flex-1 h-[1px] bg-line" />
                <span>O CON CORREO Y CONTRASEÑA</span>
                <div className="flex-1 h-[1px] bg-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isRegister && (
                  <div>
                    <label className="text-[11px] font-semibold text-fg-2 block mb-1">Nombre Completo</label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-muted absolute left-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-xl text-xs outline-none focus:border-accent focus:bg-panel text-fg"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-fg-2 block mb-1">Correo Electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-muted absolute left-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-xl text-xs outline-none focus:border-accent focus:bg-panel text-fg"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-fg-2">Contraseña</label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setIsResettingPassword(true)}
                        className="text-[11px] text-accent hover:underline cursor-pointer"
                      >
                        ¿La olvidaste?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-muted absolute left-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-xl text-xs outline-none focus:border-accent focus:bg-panel text-fg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent hover:bg-accent-strong text-accent-ink hover:text-white rounded-xl font-bold shadow-md shadow-accent/15 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRegister ? 'Registrarse con Firebase' : 'Iniciar Sesión'}</span>
                </button>
              </form>

              {/* Mode Toggle & Guest Action */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-accent hover:underline text-xs font-semibold cursor-pointer"
                >
                  {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="text-xs text-muted hover:text-fg font-medium cursor-pointer"
                >
                  Modo Invitado
                </button>
              </div>

              {/* Firebase Setup Accordion */}
              <div className="border border-line rounded-2xl overflow-hidden bg-canvas/40 mt-3">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-raised transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-fg-2 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-accent" />
                    <span>Configuración Firebase Project</span>
                    {hasFirebaseConfig ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold">
                        Conectado
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 font-bold">
                        Pendiente
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                </button>

                {isConfigOpen && (
                  <form onSubmit={handleSaveFirebaseConfig} className="p-3.5 border-t border-line space-y-2.5 bg-panel">
                    <p className="text-[11px] text-muted leading-relaxed">
                      Conecta tus credenciales de Firebase para autenticación real (desde{' '}
                      <a 
                        href="https://console.firebase.google.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-accent inline-flex items-center gap-0.5 hover:underline"
                      >
                        Firebase Console <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      ). Se guardan de forma privada en tu navegador.
                    </p>

                    <div>
                      <label className="text-[10.5px] font-semibold text-muted block mb-1">API Key</label>
                      <input
                        type="text"
                        required
                        value={firebaseApiKey}
                        onChange={(e) => setFirebaseApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs font-mono outline-none focus:border-accent text-fg"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-semibold text-muted block mb-1">Project ID</label>
                      <input
                        type="text"
                        required
                        value={firebaseProjectId}
                        onChange={(e) => setFirebaseProjectId(e.target.value)}
                        placeholder="mi-proyecto-12345"
                        className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs font-mono outline-none focus:border-accent text-fg"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-semibold text-muted block mb-1">Auth Domain (opcional)</label>
                      <input
                        type="text"
                        value={firebaseAuthDomain}
                        onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                        placeholder="mi-proyecto-12345.firebaseapp.com"
                        className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-lg text-xs font-mono outline-none focus:border-accent text-fg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-raised hover:bg-raised-2 border border-line rounded-lg text-fg font-semibold transition-colors cursor-pointer text-xs"
                    >
                      Guardar Credenciales de Firebase
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-canvas border-t border-line text-center text-[11px] text-muted flex items-center justify-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autenticación oficial con Firebase SDK de Google</span>
        </div>

      </div>
    </div>
  );
};
