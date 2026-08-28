import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  ArrowDownToLine,
  Layers,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { mediaLibrary } from '../core/media/MediaLibrary';
import { ComfyUIProvider } from '../core/providers/ComfyUIProvider';
import type { MediaAsset } from '../core/types';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAsset: (url: string, prompt: string) => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertAsset,
}) => {
  const [prompt, setPrompt] = useState('');
  const [assetType, setAssetType] = useState<'image' | 'video' | 'texture'>('image');
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>(() => mediaLibrary.getAssets());
  const comfyProvider = new ComfyUIProvider();

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    try {
      const asset = await comfyProvider.generateAsset(prompt, assetType);
      mediaLibrary.addAsset(asset);
      setAssets(mediaLibrary.getAssets());
      setPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    mediaLibrary.deleteAsset(id);
    setAssets(mediaLibrary.getAssets());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans text-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Media Library & AI Studio
              </h2>
              <p className="text-xs text-slate-500">
                Genera e inserta imágenes, texturas y videos reales en tus aplicaciones
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Generator Input */}
          <form onSubmit={handleGenerate} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Describe el asset visual o multimedia:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ejemplo: foto gastronómica de plato gourmet, fondo moderno de restaurante..."
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-violet-500 text-slate-900 resize-none font-medium"
              />
            </div>

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
                  <span>Textura</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('video')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'video' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || generating}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold shadow-md shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{generating ? 'Generando...' : 'Generar Asset'}</span>
              </button>
            </div>
          </form>

          {/* Assets Grid */}
          <div>
            <h3 className="font-bold text-xs text-slate-800 mb-3">
              Assets Disponibles ({assets.length})
            </h3>

            {assets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                No hay assets generados todavía. Escribe un prompt arriba para comenzar.
              </div>
            ) : (
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

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onInsertAsset(asset.url, asset.prompt);
                            onClose();
                          }}
                          className="flex-1 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-lg border border-violet-200 transition-colors flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          <span>Insertar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
