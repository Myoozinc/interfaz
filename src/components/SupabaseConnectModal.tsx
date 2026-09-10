import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  ExternalLink, 
  Play, 
  Key, 
  Globe, 
  Terminal, 
  Check,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { FileItem } from '../types';
import { supabaseProvisioningService } from '../core/services/SupabaseProvisioningService';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onUpdateFiles: (newFiles: FileItem[]) => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  files,
  onUpdateFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'schema'>('credentials');
  
  // Credentials
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [managementToken, setManagementToken] = useState('');

  // Status & Feedback
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlExecutionResult, setSqlExecutionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedInjected, setIsSavedInjected] = useState(false);

  // Extracted DDL SQL
  const [extractedSql, setExtractedSql] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const config = supabaseProvisioningService.getConfig();
    if (config) {
      setProjectUrl(config.projectUrl || '');
      setAnonKey(config.anonKey || '');
      setManagementToken(config.managementToken || '');
    }
    const sql = supabaseProvisioningService.extractDdlSql(files);
    setExtractedSql(sql);
    setTestResult(null);
    setSqlExecutionResult(null);
    setIsSavedInjected(false);
  }, [isOpen, files]);

  const projectRef = supabaseProvisioningService.extractProjectRef(projectUrl);

  const handleTestConnection = async () => {
    if (!projectUrl.trim() || !anonKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    const res = await supabaseProvisioningService.testConnection(projectUrl, anonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSaveAndInject = () => {
    if (!projectUrl.trim() || !anonKey.trim()) return;
    
    // Guardar en config local
    supabaseProvisioningService.saveConfig({
      projectUrl: projectUrl.trim(),
      anonKey: anonKey.trim(),
      managementToken: managementToken.trim(),
    });

    // Inyectar en archivos del workspace
    const newFiles = supabaseProvisioningService.injectCredentials(files, {
      url: projectUrl.trim(),
      anonKey: anonKey.trim(),
    });
    onUpdateFiles(newFiles);

    setIsSavedInjected(true);
    setTimeout(() => setIsSavedInjected(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(extractedSql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExecuteLiveSql = async () => {
    if (!projectRef) {
      setSqlExecutionResult({
        success: false,
        message: 'Introduce una URL válida de Supabase (ej: https://xyz.supabase.co) para obtener el project ref.',
      });
      return;
    }
    if (!managementToken.trim()) {
      setSqlExecutionResult({
        success: false,
        message: 'Introduce tu Management Access Token (sbp_...) para ejecutar SQL directamente sin salir de NONA.',
      });
      return;
    }

    setIsExecutingSql(true);
    setSqlExecutionResult(null);
    const res = await supabaseProvisioningService.executeDdlViaManagementApi(
      projectRef,
      managementToken.trim(),
      extractedSql
    );
    setSqlExecutionResult(res);
    setIsExecutingSql(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Supabase BaaS Auto-Provisioning</h3>
              <p className="text-[11px] text-slate-500">Base de datos PostgreSQL real y autenticación en la nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Conexión & Credenciales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>2. Esquema SQL DDL</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">Auto</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
          
          {/* Tab 1: Credenciales */}
          {activeTab === 'credentials' && (
            <div className="space-y-3.5">
              
              {/* URL */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Project URL de Supabase</span>
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Abrir Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {projectRef && (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Project Ref detectado: <strong className="font-mono text-emerald-700">{projectRef}</strong>
                  </span>
                )}
              </div>

              {/* Anon Key */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Project API Anon Key (Pública)</span>
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Management Access Token (Optional) */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal Access Token (Opcional, para ejecución SQL directa)</span>
                  </span>
                  <a
                    href="https://supabase.com/dashboard/account/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Generar token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="password"
                  value={managementToken}
                  onChange={(e) => setManagementToken(e.target.value)}
                  placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Success Injected Banner */}
              {isSavedInjected && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Credenciales inyectadas en <code>src/lib/supabase.ts</code> y <code>.env.local</code>!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !projectUrl || !anonKey}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                  <span>Probar Conexión</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndInject}
                  disabled={!projectUrl || !anonKey}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Conectar e Inyectar en Proyecto</span>
                </button>
              </div>

            </div>
          )}

          {/* Tab 2: Esquema SQL */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Esquema SQL DDL detectado:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer text-[11px]"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              {/* SQL Code View */}
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] overflow-x-auto max-h-56">
                <pre className="font-mono text-[11px] text-[#e6edf3] leading-relaxed">
                  {extractedSql}
                </pre>
              </div>

              {/* SQL Execution Result */}
              {sqlExecutionResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    sqlExecutionResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {sqlExecutionResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{sqlExecutionResult.message}</span>
                </div>
              )}

              {/* Action Buttons for SQL */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {projectRef && (
                  <a
                    href={supabaseProvisioningService.getSqlEditorUrl(projectRef)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors text-center"
                  >
                    <span>Abrir en Supabase SQL Editor</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleExecuteLiveSql}
                  disabled={isExecutingSql || !managementToken || !projectRef}
                  title={!managementToken ? 'Introduce un Management Token en la pestaña 1 para ejecutar' : ''}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExecutingSql ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>Ejecutar DDL en Vivo</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
