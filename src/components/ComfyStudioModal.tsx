import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  ArrowDownToLine, 
  Layers, 
  Wand2
} from 'lucide-react';
import type { ComfyAsset } from '../types';
import { comfyClient } from '../services/comfyui';

interface ComfyStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAssetToCode: (assetUrl: string, prompt: string) => void;
}

export const ComfyStudioModal: React.FC<ComfyStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertAssetToCode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [assetType, setAssetType] = useState<'image' | 'video' | 'texture'>('image');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(6);
  const [assets, setAssets] = useState<ComfyAsset[]>([
    {
      id: 'demo-1',
      prompt: 'Textura de malla de neón violeta 3D',
      type: 'texture',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
      createdAt: 'Reciente'
    },
    {
      id: 'demo-2',
      prompt: 'Fondo espacial de nebulosa cyberpunk',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80',
      createdAt: 'Reciente'
    }
  ]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setProgress(10);
    setEta(6);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
      setEta((prev) => Math.max(1, prev - 1));
    }, 600);

    try {
      const asset = await comfyClient.generateMedia(prompt, assetType);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setAssets(prev => [asset, ...prev]);
        setPrompt('');
        setGenerating(false);
        setProgress(0);
      }, 400);
    } catch {
      clearInterval(interval);
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  NONA Media Studio
                </h2>
                <span className="text-[10px] bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full">
                  Motor Gráfico IA
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Genera imágenes, texturas 3D y elementos visuales para tus aplicaciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Generator Form */}
          <form onSubmit={handleGenerate} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Describe la imagen, textura o elemento visual:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ejemplo: nave espacial retro 3D, fondo de estrellas, textura de neón..."
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500 text-slate-900 resize-none font-medium"
              />
            </div>

            {/* Progress Bar when Generating */}
            {generating && (
              <div className="p-3 bg-white border border-violet-100 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-semibold text-violet-900">
                  <span>Generando asset visual ({progress}%)...</span>
                  <span className="text-violet-600">~{eta}s restantes</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAssetType('image')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'image' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Imagen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('texture')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'texture' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Textura 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('video')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'video' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Animación</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || generating}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold shadow-md shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generating ? 'Renderizando...' : 'Generar Asset'}</span>
              </button>
            </div>
          </form>

          {/* Asset Gallery */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-violet-600" />
              <span>Galería de Medios ({assets.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs group flex flex-col justify-between">
                  <div className="h-32 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={asset.url}
                      alt={asset.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                      {asset.type}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                      {asset.prompt}
                    </p>

                    <button
                      onClick={() => {
                        onInsertAssetToCode(asset.url, asset.prompt);
                        onClose();
                      }}
                      className="w-full py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-lg border border-violet-200 transition-colors flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>Insertar en Código</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
