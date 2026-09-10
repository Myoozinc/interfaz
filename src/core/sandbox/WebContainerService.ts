/**
 * WebContainerService
 * 
 * Gestor del ciclo de vida de StackBlitz WebContainers (@webcontainer/api).
 * Permite ejecutar Node.js, Vite, npm install y servidores de desarrollo reales
 * dentro del navegador sin requerir backend propio.
 */

import { WebContainer, type FileSystemTree } from '@webcontainer/api';

export interface FileNode {
  file: {
    contents: string | Uint8Array;
  };
}

export interface DirectoryNode {
  directory: {
    [name: string]: FileNode | DirectoryNode;
  };
}

export type WebContainerFileSystemTree = FileSystemTree;

export class WebContainerService {
  private static instance: WebContainerService | null = null;
  private webcontainerPromise: Promise<WebContainer> | null = null;
  private webcontainer: WebContainer | null = null;
  private currentDevProcess: any = null;
  private isBooting = false;

  private constructor() {}

  public static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  public isCurrentlyBooting(): boolean {
    return this.isBooting;
  }

  /**
   * Determina si el entorno actual del navegador soporta WebContainers.
   * Requiere SharedArrayBuffer y Cross-Origin Isolation (COOP: same-origin, COEP: require-corp).
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const isIsolated = window.crossOriginIsolated === true;
    const hasSAB = typeof SharedArrayBuffer !== 'undefined';
    return isIsolated && hasSAB;
  }

  /**
   * Convierte un mapa plano de archivos ({ "src/App.tsx": "..." })
   * en la estructura de árbol FileSystemTree requerida por WebContainers.
   */
  public static toFileSystemTree(files: Record<string, string>): WebContainerFileSystemTree {
    const tree: WebContainerFileSystemTree = {};

    for (const [rawPath, content] of Object.entries(files)) {
      const cleanPath = rawPath.replace(/^(\.\/|\/)/, '');
      const parts = cleanPath.split('/');
      let currentDir = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (isFile) {
          currentDir[part] = {
            file: {
              contents: content
            }
          };
        } else {
          if (!currentDir[part] || !('directory' in currentDir[part])) {
            currentDir[part] = {
              directory: {}
            };
          }
          currentDir = (currentDir[part] as DirectoryNode).directory;
        }
      }
    }

    return tree;
  }

  /**
   * Inicializa la instancia única de WebContainer
   */
  public async boot(): Promise<WebContainer> {
    if (this.webcontainer) return this.webcontainer;
    if (this.webcontainerPromise) return this.webcontainerPromise;

    const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated === true;
    const hasSAB = typeof SharedArrayBuffer !== 'undefined';

    // Log claro y visible en la consola del browser para diagnóstico inmediato (Paso 2)
    console.log(
      `%c[NONA WebContainer]%c crossOriginIsolated: ${isIsolated ? 'true' : 'false'} | SharedArrayBuffer disponible: ${hasSAB ? 'sí' : 'no'}`,
      'background: #3b82f6; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      `color: ${isIsolated && hasSAB ? '#10b981' : '#ef4444'}; font-weight: bold; padding-left: 6px;`
    );
    console.info(`[WebContainer Diagnostic] crossOriginIsolated: ${isIsolated} | SharedArrayBuffer disponible: ${hasSAB ? 'sí' : 'no'}`);

    if (!this.isSupported()) {
      const reason = !isIsolated
        ? 'window.crossOriginIsolated es false (faltan los headers COOP/COEP o un recurso externo bloqueó el aislamiento).'
        : 'SharedArrayBuffer no está disponible en este navegador.';
      throw new Error(`WebContainers no está soportado en este contexto: ${reason}`);
    }

    this.isBooting = true;
    this.webcontainerPromise = (async () => {
      try {
        this.webcontainer = await WebContainer.boot();
        this.isBooting = false;
        console.log('%c[NONA WebContainer]%c Instancia boot exitosa y lista.', 'background: #10b981; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;', 'color: #10b981;');
        return this.webcontainer;
      } catch (err: any) {
        this.isBooting = false;
        this.webcontainerPromise = null;
        console.error('[WebContainer Boot Error]:', err);
        throw new Error(`Fallo al inicializar WebContainer: ${err.message || String(err)}`);
      }
    })();

    return this.webcontainerPromise;
  }

  /**
   * Monta los archivos del proyecto, ejecuta "npm install" y levanta "npm run dev".
   */
  public async mountAndStartServer(
    files: Record<string, string>,
    callbacks: {
      onServerReady: (url: string) => void;
      onOutput: (data: string) => void;
      onError: (err: string) => void;
    }
  ): Promise<void> {
    const container = await this.boot();

    callbacks.onOutput('📦 [WebContainer]: Montando estructura de archivos del proyecto...\n');
    const tree = WebContainerService.toFileSystemTree(files);
    await container.mount(tree);

    // Escuchar evento server-ready de Vite
    container.on('server-ready', (port: number, url: string) => {
      callbacks.onOutput(`🚀 [WebContainer]: Servidor de desarrollo listo en el puerto ${port} (${url})\n`);
      callbacks.onServerReady(url);
    });

    container.on('error', (err: any) => {
      callbacks.onError(`⚠️ [WebContainer Error]: ${err.message || String(err)}\n`);
    });

    // 1. Ejecutar npm install
    callbacks.onOutput('⚙️ [WebContainer]: Ejecutando npm install...\n');
    const installProcess = await container.spawn('npm', ['install']);
    installProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          callbacks.onOutput(chunk);
        }
      })
    );

    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
      throw new Error(`npm install falló con código de salida ${installExitCode}`);
    }

    callbacks.onOutput('✅ [WebContainer]: Dependencias instaladas correctamente.\n');

    // 2. Detener proceso anterior si existía
    if (this.currentDevProcess) {
      try {
        this.currentDevProcess.kill();
      } catch {}
    }

    // 3. Ejecutar npm run dev
    callbacks.onOutput('⚡ [WebContainer]: Arrancando servidor Vite con "npm run dev"...\n');
    this.currentDevProcess = await container.spawn('npm', ['run', 'dev']);
    this.currentDevProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          callbacks.onOutput(chunk);
        }
      })
    );
  }

  /**
   * Escribe o actualiza un archivo puntual dentro del WebContainer en caliente
   */
  public async writeFile(path: string, content: string): Promise<void> {
    if (!this.webcontainer) return;
    const cleanPath = path.replace(/^(\.\/|\/)/, '');
    await this.webcontainer.fs.writeFile(cleanPath, content);
  }

  /**
   * Inicia un shell interactivo ('jsh') dentro del WebContainer conectado
   * a una terminal con flujos bidireccionales de stdin/stdout.
   */
  public async startInteractiveShell(options: {
    cols?: number;
    rows?: number;
    onOutput: (data: string) => void;
    onExit?: (code: number) => void;
  }): Promise<{
    write: (data: string) => Promise<void>;
    resize: (cols: number, rows: number) => void;
    kill: () => void;
  }> {
    const container = await this.boot();
    const shellProcess = await container.spawn('jsh', {
      terminal: {
        cols: options.cols || 80,
        rows: options.rows || 24,
      },
    });

    const writer = shellProcess.input.getWriter();

    shellProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          options.onOutput(chunk);
        },
      })
    );

    shellProcess.exit.then((code: number) => {
      if (options.onExit) options.onExit(code);
    });

    return {
      write: async (data: string) => {
        await writer.write(data);
      },
      resize: (cols: number, rows: number) => {
        try {
          shellProcess.resize({ cols, rows });
        } catch {}
      },
      kill: () => {
        try {
          shellProcess.kill();
        } catch {}
      },
    };
  }
}

export const webContainerService = WebContainerService.getInstance();
