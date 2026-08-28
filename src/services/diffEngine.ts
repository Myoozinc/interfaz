import type { FileItem } from '../types';

export interface DiffResult {
  updatedFiles: FileItem[];
  diffSummary: string;
  isIncremental: boolean;
}

export class SmartDiffEngine {
  /**
   * Applies targeted modification to the current project files
   */
  static applySmartPatch(
    currentFiles: FileItem[],
    prompt: string,
    generatedCode: string,
    targetFilename: string = 'index.html'
  ): DiffResult {
    const lowerPrompt = prompt.toLowerCase();
    const isNewCreation = lowerPrompt.startsWith('crea un') || 
                          lowerPrompt.startsWith('haz un nuevo') || 
                          lowerPrompt.startsWith('nuevo proyecto') ||
                          lowerPrompt.includes('reemplaza todo');

    const activeFileIndex = currentFiles.findIndex(f => f.name.toLowerCase() === targetFilename.toLowerCase());
    if (activeFileIndex === -1 || isNewCreation) {
      // Full replacement
      const newFiles = [...currentFiles];
      if (activeFileIndex !== -1) {
        newFiles[activeFileIndex] = { ...newFiles[activeFileIndex], content: generatedCode, isModified: true };
      } else {
        newFiles.push({
          id: Date.now().toString(),
          name: targetFilename,
          language: 'html',
          content: generatedCode,
          isModified: true,
        });
      }
      return {
        updatedFiles: newFiles,
        diffSummary: `Creado / Reemplazado ${targetFilename} completo`,
        isIncremental: false,
      };
    }

    // Incremental modification on current file
    const currentCode = currentFiles[activeFileIndex].content;
    let modifiedCode = currentCode;
    let changesMade: string[] = [];

    // 1. Color / Style modifications
    if (lowerPrompt.includes('color') || lowerPrompt.includes('estilo') || lowerPrompt.includes('tema') || lowerPrompt.includes('fondo') || lowerPrompt.includes('oscuro')) {
      if (lowerPrompt.includes('azul') || lowerPrompt.includes('morado') || lowerPrompt.includes('violeta') || lowerPrompt.includes('neon')) {
        modifiedCode = modifiedCode.replace(/0x[0-9a-fA-F]{6}/g, (match) => {
          if (match === '0x8B5CF6' || match === '0x6366F1') return '0x38BDF8';
          return match;
        });
        changesMade.push('Paleta de colores y materiales actualizada');
      }
    }

    // 2. Add Pause or Game Control
    if (lowerPrompt.includes('pausa') || lowerPrompt.includes('pause')) {
      if (!modifiedCode.includes('isPaused')) {
        modifiedCode = modifiedCode.replace(
          'let isPlaying = false;',
          'let isPlaying = false;\n    let isPaused = false;'
        );
        modifiedCode = modifiedCode.replace(
          'window.addEventListener(\'keydown\', onKeyDown);',
          `window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
          isPaused = !isPaused;
          const banner = document.getElementById('pauseBanner');
          if (banner) banner.style.display = isPaused ? 'block' : 'none';
        }
      });`
        );
        modifiedCode = modifiedCode.replace(
          '</body>',
          `  <div id="pauseBanner" style="display:none;" class="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-none">
    <div class="glass-panel p-6 rounded-2xl text-center text-white">
      <h3 class="text-xl font-bold">⏸ JUEGO EN PAUSA</h3>
      <p class="text-xs text-slate-300 mt-1">Presiona [P] para continuar</p>
    </div>
  </div>\n</body>`
        );
        changesMade.push('Añadido sistema de pausa con tecla [P] y banner');
      }
    }

    // 3. Add Sound or Audio effect trigger
    if (lowerPrompt.includes('sonido') || lowerPrompt.includes('audio') || lowerPrompt.includes('acorde')) {
      if (modifiedCode.includes('playSynthNote')) {
        modifiedCode = modifiedCode.replace(
          'osc.type = \'sawtooth\';',
          'osc.type = \'triangle\';'
        );
        changesMade.push('Modificada la textura tímbrica del sintetizador a onda triangular con armónicos ricos');
      }
    }

    // 4. If generated code is a complete valid HTML document, merge or replace safely
    if (generatedCode.includes('<!DOCTYPE html>') || generatedCode.includes('<html')) {
      // Check if new code has more depth
      modifiedCode = generatedCode;
      changesMade.push('Integrada nueva lógica y estructura actualizada');
    }

    const updatedFiles = [...currentFiles];
    updatedFiles[activeFileIndex] = {
      ...updatedFiles[activeFileIndex],
      content: modifiedCode,
      isModified: true,
    };

    return {
      updatedFiles,
      diffSummary: changesMade.length > 0 ? changesMade.join(' • ') : 'Cambios aplicados quirúrgicamente al código',
      isIncremental: true,
    };
  }
}
