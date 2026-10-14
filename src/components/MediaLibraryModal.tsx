import React, { useState } from 'react';
import { 
  X, 
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
    <div className="fixed inset-0 z-50 bg-raised/40 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans text-xs">
      <div className="bg-panel border border-line rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-6 bg-canvas border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-fg">
                Media Library & AI Studio
              </h2>
              <p className="text-xs text-muted">
                Genera e inserta imágenes, texturas y videos reales en tus aplicaciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-raised-2 text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Generator Input */}
          <form onSubmit={handleGenerate} className="p-4 bg-canvas border border-line rounded-2xl space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-fg-2 block mb-1">
                Describe el asset visual o multimedia:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ejemplo: foto gastronómica de plato gourmet, fondo moderno de restaurante..."
                rows={2}
                className="w-full p-2.5 bg-panel border border-line rounded-xl text-xs outline-none focus:border-accent text-fg resize-none font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-panel p-1 rounded-xl border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setAssetType('image')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'image' ? 'bg-accent text-white shadow-xs' : 'text-fg-2 hover:text-fg'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Imagen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('texture')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'texture' ? 'bg-accent text-white shadow-xs' : 'text-fg-2 hover:text-fg'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Textura</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('video')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    assetType === 'video' ? 'bg-accent text-white shadow-xs' : 'text-fg-2 hover:text-fg'
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
                {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>{generating ? 'Generando...' : 'Generar Asset'}</span>
              </button>
            </div>
          </form>

          {/* Assets Grid */}
          <div>
            <h3 className="font-bold text-xs text-fg mb-3">
              Assets Disponibles ({assets.length})
            </h3>

            {assets.length === 0 ? (
              <div className="p-8 text-center bg-canvas border border-line rounded-2xl text-muted">
                No hay assets generados todavía. Escribe un prompt arriba para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="bg-canvas border border-line rounded-2xl overflow-hidden shadow-2xs group flex flex-col justify-between">
                    <div className="h-32 w-full bg-raised relative overflow-hidden flex items-center justify-center">
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
                      <p className="text-[11px] text-fg-2 font-medium line-clamp-2">
                        {asset.prompt}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onInsertAsset(asset.url, asset.prompt);
                            onClose();
                          }}
                          className="flex-1 py-1.5 bg-accent/10 hover:bg-accent/15 text-accent font-bold rounded-lg border border-accent/30 transition-colors flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          <span>Insertar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
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
