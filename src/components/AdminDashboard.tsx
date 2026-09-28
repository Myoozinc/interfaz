import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  FolderArchive,
  Activity,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Code2,
  Layers,
  Sparkles,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  X
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  telemetryService,
  type AdminAnalyticsData,
  type UserVisitRecord,
  type GenerationBackupRecord
} from '../services/telemetryService';
import { VirtualMultiFileBundler } from '../core/sandbox/VirtualMultiFileBundler';

interface AdminDashboardProps {
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nona_admin_auth') === 'true';
  });
  const [adminCode, setAdminCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'visitors' | 'vault' | 'ux_timeline'>('analytics');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  // Modals for inspection
  const [inspectingGeneration, setInspectingGeneration] = useState<GenerationBackupRecord | null>(null);
  const [inspectingVisit, setInspectingVisit] = useState<UserVisitRecord | null>(null);
  const [previewingGeneration, setPreviewingGeneration] = useState<GenerationBackupRecord | null>(null);
  const [selectedFileInInspect, setSelectedFileInInspect] = useState<string>('');

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    if (adminCode.trim() !== 'Gingerboy' || adminPassword.trim() !== 'Rona12345') {
      setAuthError('Código o contraseña incorrectos. Verifique los datos de acceso.');
      setIsLoggingIn(false);
      return;
    }

    try {
      // Test fetch to confirm access
      const fetched = await telemetryService.fetchAdminData(adminCode.trim(), adminPassword.trim());
      setData(fetched);
      sessionStorage.setItem('nona_admin_auth', 'true');
      sessionStorage.setItem('nona_admin_code', adminCode.trim());
      sessionStorage.setItem('nona_admin_pass', adminPassword.trim());
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'Error al conectar con la bóveda de administración.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nona_admin_auth');
    sessionStorage.removeItem('nona_admin_code');
    sessionStorage.removeItem('nona_admin_pass');
    setIsAuthenticated(false);
    setData(null);
  };

  // Fetch telemetry data from server
  const loadData = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(null);
    const code = sessionStorage.getItem('nona_admin_code') || 'Gingerboy';
    const pass = sessionStorage.getItem('nona_admin_pass') || 'Rona12345';

    try {
      const result = await telemetryService.fetchAdminData(code, pass);
      setData(result);
    } catch (err: any) {
      setFetchError(err.message || 'Error cargando datos reales.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Auto-refresh interval
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  // Filtered Visitors
  const filteredVisits = useMemo(() => {
    if (!data) return [];
    return data.visits.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        v.ip.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.browser.toLowerCase().includes(q) ||
        v.os.toLowerCase().includes(q);
      const matchesCountry = countryFilter === 'all' || v.country === countryFilter;
      const matchesDevice = deviceFilter === 'all' || v.device.toLowerCase() === deviceFilter.toLowerCase();
      return matchesSearch && matchesCountry && matchesDevice;
    });
  }, [data, searchQuery, countryFilter, deviceFilter]);

  // Filtered Generations Vault
  const filteredGenerations = useMemo(() => {
    if (!data) return [];
    return data.generations.filter(g => {
      const q = searchQuery.toLowerCase();
      return !q ||
        g.prompt.toLowerCase().includes(q) ||
        g.projectName.toLowerCase().includes(q) ||
        g.ip.toLowerCase().includes(q) ||
        g.country.toLowerCase().includes(q);
    });
  }, [data, searchQuery]);

  // Unique countries list for filter
  const uniqueCountries = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.visits.forEach(v => {
      if (v.country) set.add(v.country);
    });
    return Array.from(set).sort();
  }, [data]);

  // Download project backup as ZIP
  const handleDownloadZip = async (backup: GenerationBackupRecord) => {
    const zip = new JSZip();
    backup.files.forEach(f => {
      const cleanPath = f.path.replace(/^[./]+/, '');
      zip.file(cleanPath, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${backup.projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_backup.zip`;
    saveAs(blob, filename);
  };

  // Export full telemetry as JSON
  const handleExportTelemetryJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `nona_telemetry_export_${new Date().toISOString().slice(0, 10)}.json`);
  };

  // Purge / Clear logs
  const handleClearLogs = async () => {
    if (!window.confirm('¿Estás seguro de que deseas purgar todos los registros de visitas y eventos? Esta acción no se puede deshacer.')) {
      return;
    }
    const code = sessionStorage.getItem('nona_admin_code') || 'Gingerboy';
    const pass = sessionStorage.getItem('nona_admin_pass') || 'Rona12345';
    try {
      await telemetryService.clearData(code, pass);
      await loadData();
      alert('Registros limpiados exitosamente.');
    } catch (e: any) {
      alert(e.message || 'Error al limpiar.');
    }
  };

  // Bundle preview for a generation in vault
  const previewSrcDoc = useMemo(() => {
    if (!previewingGeneration) return '';
    const filesMap: Record<string, string> = {};
    previewingGeneration.files.forEach(f => {
      const p = f.path.replace(/^[./]+/, '');
      filesMap[p] = f.content;
    });
    const bundled = VirtualMultiFileBundler.bundle(filesMap);
    return bundled.srcDoc;
  }, [previewingGeneration]);

  // ---------------------------------------------------------------------------
  // 1. GATEWAY DE AUTENTICACIÓN (LOGIN)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-fade-in">
          {/* Logo / Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              NONA Master Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Espacio Confidencial de Telemetría Real y Control UX
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Código de Administrador
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Introduce el código de acceso"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña Maestra
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Introduce la contraseña"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Acceder al Panel Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onBackToApp}
              className="hover:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Aplicación</span>
            </button>
            <span className="font-mono text-[11px] text-slate-600">NONA v5.0 Master</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. PANEL ADMINISTRATIVO PRINCIPAL (AUTHENTICATED)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Top Admin Header Bar */}
      <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">NONA Master Control Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Registros Reales en Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Telemetría de usuarios reales, geolocalización de IPs y resguardo de software generado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              autoRefresh
                ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Actualización automática en tiempo real cada 12 segundos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'text-indigo-400 animate-spin-slow' : ''}`} />
            <span>Auto-Refresh {autoRefresh ? 'Activo' : 'Pausado'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Recargar datos ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Export Telemetry */}
          <button
            onClick={handleExportTelemetryJson}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            title="Exportar base de datos de telemetría en JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-all border border-slate-700 cursor-pointer"
            title="Purgar registros históricos"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Volver a la App */}
          <button
            onClick={onBackToApp}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la App</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 cursor-pointer"
            title="Cerrar sesión de administrador"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {fetchError && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-200 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => loadData()}
              className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-white font-semibold transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* KPI Cards: Métricas Reales Clave */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Total Visitas */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Visitas</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.totalVisits || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Registros reales</p>
          </div>

          {/* 2. IPs Únicas */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">IPs Únicas</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.uniqueIps || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Visitantes distintos</p>
          </div>

          {/* 3. Apps Generadas (Bóveda) */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Apps en Bóveda</span>
              <FolderArchive className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.totalGenerations || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Resguardo completo</p>
          </div>

          {/* 4. Total Eventos */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Acciones en App</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.totalEvents || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Clicks & Prompts</p>
          </div>

          {/* 5. Países Detectados */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Países Detectados</span>
              <MapPin className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.countryBreakdown?.length || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Geolocalización real</p>
          </div>

          {/* 6. Dispositivos Móviles */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Tráfico Móvil</span>
              <Smartphone className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {data?.stats?.totalVisits ? Math.round(((data.stats.deviceBreakdown['Mobile'] || 0) / data.stats.totalVisits) * 100) : 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Smartphones / Tablets</p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Gráficos y Métricas Reales</span>
            </button>

            <button
              onClick={() => setActiveTab('visitors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'visitors'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Registro de Visitantes e IPs ({data?.visits?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Bóveda de Software Generado ({data?.generations?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('ux_timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ux_timeline'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Línea de Tiempo UX & Acciones</span>
            </button>
          </div>

          {/* Search Input for tables */}
          {(activeTab === 'visitors' || activeTab === 'vault') && (
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'visitors' ? "Buscar por IP, país, ciudad..." : "Buscar por prompt o proyecto..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: GRÁFICOS Y MÉTRICAS REALES */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Grid de Gráficos Reales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Gráfico 1: Países y Distribución Geográfica */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">Distribución Geográfica Real (Países)</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {data?.stats?.countryBreakdown?.length || 0} países
                  </span>
                </div>

                {(!data?.stats?.countryBreakdown || data.stats.countryBreakdown.length === 0) ? (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                    Aún no hay visitas registradas para proyectar el mapa geográfico.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.stats.countryBreakdown.slice(0, 7).map((item, idx) => {
                      const total = data.stats.totalVisits || 1;
                      const percentage = Math.round((item.count / total) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-300 font-medium">
                              <span className="text-base leading-none">{item.flag}</span>
                              <span>{item.country}</span>
                            </span>
                            <span className="text-slate-400 font-mono">
                              {item.count} visitas ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gráfico 2: Plataformas y Dispositivos */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">Dispositivos y Plataformas Reales</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">Desktop / Mobile / Tablet</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['Desktop', 'Mobile', 'Tablet'].map((dev) => {
                    const count = data?.stats?.deviceBreakdown[dev] || 0;
                    const total = data?.stats?.totalVisits || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={dev} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                        <div className="flex justify-center mb-1.5 text-slate-400">
                          {dev === 'Desktop' ? <Monitor className="w-4 h-4 text-indigo-400" /> :
                           dev === 'Mobile' ? <Smartphone className="w-4 h-4 text-pink-400" /> :
                           <Tablet className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="text-base font-bold text-white">{count}</div>
                        <div className="text-[11px] text-slate-400">{dev} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>

                {/* Navegadores */}
                <h3 className="text-xs font-semibold text-slate-300 mb-2 mt-4">Navegadores Utilizados:</h3>
                <div className="space-y-2">
                  {Object.entries(data?.stats?.browserBreakdown || {}).slice(0, 5).map(([b, count]) => {
                    const total = data?.stats?.totalVisits || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={b} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-slate-300 font-medium">{b}</span>
                        <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 3: Embudo de Conversión & Adopción de Funciones */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h2 className="text-sm font-bold text-white">Embudo de Uso y Experiencia (UX Funnel)</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">Métricas reales de interacción</span>
                </div>

                {(() => {
                  const visits = data?.stats?.totalVisits || 0;
                  const prompts = data?.visits?.reduce((acc, v) => acc + (v.promptsCount || 0), 0) || 0;
                  const generations = data?.stats?.totalGenerations || 0;
                  const exports = data?.events?.filter(e => e.type === 'export_zip').length || 0;

                  const steps = [
                    { name: '1. Entrada a la App (Sesiones)', count: visits, color: 'from-sky-500 to-indigo-500' },
                    { name: '2. Envió al menos 1 Prompt', count: prompts, color: 'from-indigo-500 to-violet-500' },
                    { name: '3. Generación Exitosa de Software', count: generations, color: 'from-violet-500 to-purple-500' },
                    { name: '4. Exportación / Descarga de Código', count: exports, color: 'from-purple-500 to-pink-500' }
                  ];

                  return (
                    <div className="space-y-4">
                      {steps.map((st, i) => {
                        const pct = visits > 0 ? Math.round((st.count / visits) * 100) : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-semibold">{st.name}</span>
                              <span className="text-slate-400 font-mono">{st.count} {st.count === 1 ? 'vez' : 'veces'}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${st.color} rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(100, Math.max(pct, st.count > 0 ? 8 : 0))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Gráfico 4: Resumen de Retención y Salud de la Plataforma */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-bold text-white">Salud del Software Factory & UX</h2>
                    </div>
                    <span className="text-[11px] text-slate-400">Auditoría continua</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Total de proyectos resguardados</span>
                      <span className="font-bold text-white font-mono">{data?.stats?.totalGenerations || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Total de eventos de usuario registrados</span>
                      <span className="font-bold text-indigo-400 font-mono">{data?.stats?.totalEvents || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Última actualización de la base de datos</span>
                      <span className="font-medium text-slate-300 font-mono text-[11px]">
                        {data?.stats?.lastUpdated ? new Date(data.stats.lastUpdated).toLocaleTimeString() : 'Ahora'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 mt-4">
                  💡 <span className="font-semibold">Sin datos simulados:</span> Todos los contadores provienen directamente de las conexiones HTTP reales y eventos del cliente capturados en Vercel.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: REGISTRO DE VISITANTES (IPS & GEOLOCALIZACIÓN) */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'visitors' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="font-bold text-slate-400">Filtrar por:</span>
              
              {/* Country Filter */}
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos los países ({uniqueCountries.length})</option>
                {uniqueCountries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Device Filter */}
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todos los dispositivos</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>

              <div className="ml-auto text-slate-500 font-mono">
                Mostrando {filteredVisits.length} de {data?.visits?.length || 0} visitas
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Dirección IP</th>
                      <th className="py-3 px-4">País & Ubicación</th>
                      <th className="py-3 px-4">Dispositivo / SO</th>
                      <th className="py-3 px-4">Navegador</th>
                      <th className="py-3 px-4">Primera Visita</th>
                      <th className="py-3 px-4">Tiempo en App</th>
                      <th className="py-3 px-4">Prompts</th>
                      <th className="py-3 px-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredVisits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No se encontraron registros de visitantes con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredVisits.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-200">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {v.ip}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{v.flag}</span>
                              <span className="font-semibold text-white">{v.country}</span>
                              {v.city && v.city !== 'Desconocido' && (
                                <span className="text-slate-400">({v.city})</span>
                              )}
                            </div>
                            {v.latitude && v.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <MapPin className="w-2.5 h-2.5" />
                                {v.latitude.toFixed(2)}, {v.longitude.toFixed(2)}
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              {v.device === 'Mobile' ? <Smartphone className="w-3.5 h-3.5 text-pink-400" /> :
                               v.device === 'Tablet' ? <Tablet className="w-3.5 h-3.5 text-amber-400" /> :
                               <Monitor className="w-3.5 h-3.5 text-indigo-400" />}
                              <span>{v.device}</span>
                              <span className="text-slate-500">({v.os})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {v.browser}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(v.firstSeen).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {v.durationSeconds > 60
                              ? `${Math.floor(v.durationSeconds / 60)}m ${v.durationSeconds % 60}s`
                              : `${v.durationSeconds || 0}s`}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              v.promptsCount > 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-500'
                            }`}>
                              {v.promptsCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setInspectingVisit(v)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
                            >
                              Ver Historial
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: BÓVEDA DE SOFTWARE GENERADO ("UN RESGUARDO DE LO QUE GENERE") */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>
                Resguardo inmutable de cada aplicación generada por los usuarios en la plataforma.
              </p>
              <span className="font-mono text-slate-500">
                {filteredGenerations.length} proyectos archivados
              </span>
            </div>

            {filteredGenerations.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <FolderArchive className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-50" />
                <h3 className="font-bold text-slate-300 mb-1">Aún no hay software generado en la bóveda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cada vez que un usuario solicite a NONA crear una página o aplicación, se almacenará aquí un resguardo completo de todos los archivos y el prompt exacto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Header Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-base">{gen.flag}</span>
                          <span className="text-xs font-semibold text-slate-400 truncate">
                            {gen.country} {gen.city && `(${gen.city})`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(gen.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Project Name */}
                      <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{gen.projectName}</span>
                      </h3>

                      {/* Prompt */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 mb-3">
                        <p className="text-xs text-slate-300 italic line-clamp-3 font-mono">
                          "{gen.prompt}"
                        </p>
                      </div>

                      {/* File count badge */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-semibold">
                          {gen.fileCount} archivos
                        </span>
                        <span className="font-mono text-slate-500">
                          IP: {gen.ip}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setInspectingGeneration(gen);
                          setSelectedFileInInspect(gen.files[0]?.path || '');
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver Código</span>
                      </button>

                      <button
                        onClick={() => setPreviewingGeneration(gen)}
                        className="flex-1 py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Previsualizar</span>
                      </button>

                      <button
                        onClick={() => handleDownloadZip(gen)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shrink-0"
                        title="Descargar ZIP"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: LÍNEA DE TIEMPO UX & AUDITORÍA */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'ux_timeline' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>
                Flujo cronológico de acciones ejecutadas por usuarios reales para auditar la experiencia de usuario (UX).
              </p>
              <span className="font-mono text-slate-500">
                Últimos {data?.events?.length || 0} eventos
              </span>
            </div>

            {(!data?.events || data.events.length === 0) ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-50" />
                <h3 className="font-bold text-slate-300 mb-1">Aún no hay eventos registrados</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A medida que los usuarios utilicen la interfaz (escriban mensajes, exploren plantillas o descarguen código), cada paso quedará registrado aquí.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
                {data.events.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        {evt.type === 'prompt_submit' ? <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> :
                         evt.type === 'export_zip' ? <Download className="w-3.5 h-3.5 text-emerald-400" /> :
                         evt.type === 'auto_fix_error' ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> :
                         <Activity className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{evt.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                            {evt.type}
                          </span>
                        </div>
                        {evt.details && (
                          <div className="text-slate-400 mt-1 font-mono text-[11px]">
                            {typeof evt.details === 'object' ? JSON.stringify(evt.details) : String(evt.details)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-slate-500 font-mono text-[11px]">
                      <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                      <div>{evt.country} ({evt.ip})</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: INSPECCIONAR ARCHIVOS DEL PROYECTO GENERADO */}
      {/* -------------------------------------------------------------------- */}
      {inspectingGeneration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {inspectingGeneration.projectName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Prompt original: "{inspectingGeneration.prompt}"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadZip(inspectingGeneration)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar ZIP</span>
                </button>
                <button
                  onClick={() => setInspectingGeneration(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Split files list and code viewer */}
            <div className="flex-1 flex overflow-hidden">
              {/* File list */}
              <div className="w-64 bg-slate-950/60 border-r border-slate-800 p-3 overflow-y-auto space-y-1 shrink-0">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Archivos ({inspectingGeneration.files.length})
                </div>
                {inspectingGeneration.files.map(f => (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFileInInspect(f.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 truncate cursor-pointer ${
                      selectedFileInInspect === f.path
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f.path}</span>
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="flex-1 bg-slate-950 p-4 overflow-auto">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {inspectingGeneration.files.find(f => f.path === selectedFileInInspect)?.content || 'Selecciona un archivo para ver su código.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: LIVE SANDBOX PREVIEW DE PROYECTO GENERADO */}
      {/* -------------------------------------------------------------------- */}
      {previewingGeneration && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Vista Previa: {previewingGeneration.projectName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Renderizado mediante Virtual Multi-File Bundler en entorno aislado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingGeneration(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 overflow-hidden">
              <iframe
                title="Admin Preview Sandbox"
                srcDoc={previewSrcDoc}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: DETALLE DE VISITA DE USUARIO */}
      {/* -------------------------------------------------------------------- */}
      {inspectingVisit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{inspectingVisit.flag}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{inspectingVisit.country}</h3>
                  <p className="text-xs text-slate-400">{inspectingVisit.city || 'Ciudad no determinada'}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingVisit(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Dirección IP:</span>
                <span className="text-white font-bold">{inspectingVisit.ip}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Dispositivo:</span>
                <span className="text-slate-200">{inspectingVisit.device} ({inspectingVisit.os})</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Navegador:</span>
                <span className="text-slate-200">{inspectingVisit.browser}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Idioma:</span>
                <span className="text-slate-200">{inspectingVisit.language}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Referrer:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{inspectingVisit.referrer}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Primera visita:</span>
                <span className="text-slate-200">{new Date(inspectingVisit.firstSeen).toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-500">Duración en app:</span>
                <span className="text-emerald-400 font-bold">{inspectingVisit.durationSeconds} segundos</span>
              </div>
            </div>

            <button
              onClick={() => setInspectingVisit(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
