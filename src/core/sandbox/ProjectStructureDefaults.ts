/**
 * ProjectStructureDefaults
 * 
 * Plantillas y utilidades estándar de Vite + React + TypeScript + Tailwind
 * para asegurar que cualquier proyecto generado o exportado en NONA sea
 * un proyecto real, modular y listo para ejecutar con "npm install && npm run dev".
 */

export const DEFAULT_PACKAGE_JSON = JSON.stringify({
  name: "nona-app",
  private: true,
  version: "0.1.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview"
  },
  dependencies: {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.469.0",
    clsx: "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "@supabase/supabase-js": "^2.47.10"
  },
  devDependencies: {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    autoprefixer: "^10.4.20",
    postcss: "^8.4.49",
    tailwindcss: "^3.4.17",
    typescript: "^5.6.3",
    vite: "^6.0.7"
  }
}, null, 2);

export const DEFAULT_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
`;

export const DEFAULT_TSCONFIG_JSON = JSON.stringify({
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    module: "ESNext",
    skipLibCheck: true,
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react-jsx",
    strict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noFallthroughCasesInSwitch: true,
    baseUrl: ".",
    paths: {
      "@/*": ["src/*"]
    }
  },
  include: ["src"]
}, null, 2);

export const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NONA App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

export const DEFAULT_MAIN_TSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

export const DEFAULT_INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
`;

export const DEFAULT_APP_TSX = `import React, { useState } from 'react';
import { Sparkles, Code2, Play } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6 backdrop-blur-sm">
        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NONA React Studio
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Proyecto multi-archivo Vite + TypeScript + Tailwind
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Contador Interactivo:</span>
          <button
            onClick={() => setCount(c => c + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            {count} clics
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Escribe en el chat para solicitar nuevas vistas, componentes y funcionalidades.
        </p>
      </div>
    </div>
  );
}
`;

export const DEFAULT_SUPABASE_CLIENT = `import { createClient } from '@supabase/supabase-js';

// Cliente Supabase seguro para Vite + React en NONA Studio.
// Si las variables de entorno no están configuradas, utiliza valores seguros de desarrollo
// para evitar runtime crashes en el Sandbox y permitir prototipado inmediato.
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
  || 'https://mock-project.supabase.co';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key-nona-development';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper para verificar el estado de conexión de Supabase
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('_healthcheck').select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Conectado a Supabase correctamente.' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Modo mock desarrollo activo' };
  }
}
`;

export const DEFAULT_LIB_UTILS = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

export const DEFAULT_TYPES_INDEX = `/**
 * Definiciones globales de tipos e interfaces (NONA Studio)
 */

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}
`;

/**
 * Detecta si la instrucción del usuario requiere backend o persistencia de datos (BaaS)
 */
export function detectBaaSRequirement(prompt: string): boolean {
  const p = (prompt || '').toLowerCase();
  const keywords = [
    'supabase', 'base de datos', 'basededatos', 'database', 'sql',
    'guardar usuarios', 'guarde usuarios', 'guarden usuarios', 'guarden los usuarios',
    'autenticacion', 'autenticación',
    'login', 'registro', 'auth', 'signup', 'sign up', 'sign in', 'signin',
    'persistir', 'persistencia', 'guardar datos', 'guarde datos', 'guarden datos',
    'almacenar datos', 'almacenar usuarios',
    'tabla de', 'tablas', 'backend', 'baas', 'crud'
  ];
  return keywords.some(kw => p.includes(kw));
}

export interface ProjectArchitectureReport {
  hasComponents: boolean;
  hasPages: boolean;
  hasLib: boolean;
  hasTypes: boolean;
  hasBaaS: boolean;
  score: number; // 0 a 100
  recommendations: string[];
}

/**
 * Analiza la adherencia del proyecto a la arquitectura de carpetas convencional
 * (src/components/, src/pages/, src/lib/, src/types/)
 */
export function analyzeProjectStructure(files: Record<string, string>): ProjectArchitectureReport {
  const keys = Object.keys(files).map(k => k.replace(/^(\.\/|\/)/, ''));
  const hasComponents = keys.some(k => k.startsWith('src/components/'));
  const hasPages = keys.some(k => k.startsWith('src/pages/') || k.startsWith('src/routes/') || k.startsWith('src/views/'));
  const hasLib = keys.some(k => k.startsWith('src/lib/') || k.startsWith('src/utils/'));
  const hasTypes = keys.some(k => k.startsWith('src/types/') || k.endsWith('.d.ts'));
  const hasBaaS = keys.some(k => k.includes('supabase') || (files[k] && files[k].includes('@supabase/supabase-js')));

  let score = 50;
  if (hasComponents) score += 15;
  if (hasPages) score += 15;
  if (hasLib) score += 10;
  if (hasTypes) score += 10;

  const recommendations: string[] = [];
  if (!hasComponents && keys.filter(k => k.endsWith('.tsx')).length > 2) {
    recommendations.push('Organizar componentes reutilizables dentro de "src/components/".');
  }
  if (!hasPages && keys.filter(k => k.endsWith('.tsx')).length > 4) {
    recommendations.push('Separar vistas de página completas dentro de "src/pages/".');
  }
  if (!hasLib) {
    recommendations.push('Incluir utilidades compartidas en "src/lib/utils.ts".');
  }
  if (!hasTypes) {
    recommendations.push('Definir modelos de datos e interfaces en "src/types/index.ts".');
  }

  return {
    hasComponents,
    hasPages,
    hasLib,
    hasTypes,
    hasBaaS,
    score: Math.min(100, score),
    recommendations
  };
}

/**
 * Asegura que una colección de archivos contenga la estructura completa
 * de un proyecto Vite estándar ejecutable, inyectando utilidades o clientes BaaS
 * si son referenciados o requeridos.
 */
export function ensureCompleteViteProject(
  files: Record<string, string>,
  options?: { includeBaaS?: boolean }
): Record<string, string> {
  const result: Record<string, string> = { ...files };

  if (!result['package.json']) {
    result['package.json'] = DEFAULT_PACKAGE_JSON;
  }
  if (!result['vite.config.ts'] && !result['vite.config.js']) {
    result['vite.config.ts'] = DEFAULT_VITE_CONFIG;
  }
  if (!result['tsconfig.json']) {
    result['tsconfig.json'] = DEFAULT_TSCONFIG_JSON;
  }
  if (!result['index.html']) {
    result['index.html'] = DEFAULT_INDEX_HTML;
  }
  if (!result['src/main.tsx'] && !result['src/main.jsx'] && !result['src/main.js']) {
    result['src/main.tsx'] = DEFAULT_MAIN_TSX;
  }
  if (!result['src/index.css'] && !result['src/App.css'] && !result['index.css']) {
    result['src/index.css'] = DEFAULT_INDEX_CSS;
  }
  if (!result['src/App.tsx'] && !result['src/App.jsx'] && !result['src/App.js']) {
    // Check if there is any other main component or root (excluding main entrypoint)
    const hasComponent = Object.keys(result).some(
      k => k.startsWith('src/') && 
      (k.endsWith('.tsx') || k.endsWith('.jsx')) && 
      !k.startsWith('src/main.')
    );
    if (!hasComponent) {
      result['src/App.tsx'] = DEFAULT_APP_TSX;
    }
  }

  // Soporte de BaaS (Supabase): si alguna parte del código lo importa o si se solicita explícitamente
  const importsSupabase = Object.values(result).some(content => 
    content.includes('supabase') || 
    content.includes('@supabase/supabase-js')
  );
  if ((options?.includeBaaS || importsSupabase) && !result['src/lib/supabase.ts'] && !result['src/lib/supabase.js']) {
    result['src/lib/supabase.ts'] = DEFAULT_SUPABASE_CLIENT;
  }

  // Utilidades helper: si se importan clases utils o cn()
  const usesCn = Object.values(result).some(content => 
    content.includes('cn(') || 
    content.includes('tailwind-merge')
  );
  if (usesCn && !result['src/lib/utils.ts'] && !result['src/lib/utils.js']) {
    result['src/lib/utils.ts'] = DEFAULT_LIB_UTILS;
  }

  return result;
}

