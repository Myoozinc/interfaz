import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { GitHubIcon } from './icons/GitHubIcon';
import type { FileItem } from '../types';
import { gitHubService, type GitHubUserProfile } from '../core/services/GitHubService';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: FileItem[];
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  files,
}) => {
  const [token, setToken] = useState(() => localStorage.getItem('nona_github_token') || '');
  const [userProfile, setUserProfile] = useState<GitHubUserProfile | null>(null);
  const [repoName, setRepoName] = useState(() => gitHubService.sanitizeRepoName(projectName));
  const [description, setDescription] = useState('Creado con NONA AI Software Factory (React + Vite + Tailwind)');
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState('feat: Despliegue inicial generado por NONA AI Software Factory');

  // Loading & Progress States
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    repoUrl: string;
    commitSha: string;
    vercelUrl: string;
  } | null>(null);

  // Validar token al abrir o al cambiar
  useEffect(() => {
    if (!isOpen) return;
    setRepoName(gitHubService.sanitizeRepoName(projectName));
    setErrorMessage(null);
    setSuccessData(null);

    const savedToken = localStorage.getItem('nona_github_token');
    if (savedToken) {
      validateGitHubToken(savedToken);
    }
  }, [isOpen, projectName]);

  const validateGitHubToken = async (tokenToTest: string) => {
    if (!tokenToTest.trim()) return;
    setIsValidatingToken(true);
    setErrorMessage(null);
    try {
      const profile = await gitHubService.validateToken(tokenToTest);
      setUserProfile(profile);
      localStorage.setItem('nona_github_token', tokenToTest.trim());
    } catch (err: any) {
      setUserProfile(null);
      setErrorMessage(err.message || 'Error al validar el token de GitHub.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleExportToGitHub = async () => {
    if (!token.trim()) {
      setErrorMessage('Por favor introduce tu Personal Access Token de GitHub.');
      return;
    }
    if (!userProfile) {
      setErrorMessage('Primero debes validar un token de GitHub válido.');
      return;
    }
    if (!repoName.trim()) {
      setErrorMessage('El nombre del repositorio no puede estar vacío.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setSuccessData(null);
    setExportProgressText('Iniciando creación de repositorio en GitHub...');

    try {
      // 1. Crear repositorio
      const repoResult = await gitHubService.createRepository(token, {
        name: repoName,
        description,
        isPrivate,
      });

      // 2. Subir todos los archivos
      setExportProgressText('Subiendo archivos del proyecto y componentes...');
      const pushResult = await gitHubService.pushFiles(
        token,
        userProfile.login,
        repoResult.name,
        files,
        commitMessage,
        (status) => setExportProgressText(status)
      );

      // 3. Generar enlace a Vercel
      const vercelUrl = gitHubService.getVercelDeployUrl(repoResult.html_url);

      setSuccessData({
        repoUrl: repoResult.html_url,
        commitSha: pushResult.commitSha,
        vercelUrl,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al exportar el proyecto a GitHub.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GitHubIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Sincronización con GitHub</h3>
              <p className="text-[11px] text-slate-500">Crea un repositorio real y publica tu código en 1 clic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-red-700 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {successData ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">¡Repositorio Creado y Sincronizado!</h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Todos los {files.length} archivos fueron subidos exitosamente a GitHub.
                </p>
              </div>

              {/* Links Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">URL del Repositorio:</span>
                  <a
                    href={successData.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{successData.repoUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Último Commit:</span>
                  <span className="font-mono text-slate-600">{successData.commitSha.slice(0, 7)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={successData.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  <GitHubIcon className="w-4 h-4" />
                  <span>Ver en GitHub</span>
                </a>

                <a
                  href={successData.vercelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Deploy en Vercel</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Token Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>GitHub Personal Access Token (PAT)</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=NONA+Studio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Crear token (scope: repo)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => validateGitHubToken(token)}
                    disabled={isValidatingToken || !token.trim()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isValidatingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verificar'}
                  </button>
                </div>

                {userProfile && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.login}
                      className="w-6 h-6 rounded-full border border-emerald-300"
                    />
                    <span className="text-emerald-800 font-medium text-xs">
                      Autenticado como: <strong>@{userProfile.login}</strong> ({userProfile.name})
                    </span>
                  </div>
                )}
              </div>

              {/* Repo Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nombre del Repositorio</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="mi-proyecto-nona"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Descripción</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del proyecto..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    {isPrivate ? <Lock className="w-4 h-4 text-amber-600" /> : <Globe className="w-4 h-4 text-indigo-600" />}
                    <div>
                      <span className="font-semibold text-slate-700 block text-xs">
                        {isPrivate ? 'Repositorio Privado' : 'Repositorio Público'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isPrivate ? 'Solo tú podrás ver este código' : 'Cualquiera podrá ver y clonar este código'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      isPrivate ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isPrivate ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mensaje de Commit</label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Export Status while running */}
              {isExporting && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-700 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span>{exportProgressText}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleExportToGitHub}
                disabled={isExporting || !userProfile}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sincronizando con GitHub...</span>
                  </>
                ) : (
                  <>
                    <GitHubIcon className="w-4 h-4" />
                    <span>Crear y Subir a GitHub ({files.length} archivos)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
