import { 
  analyzeProjectStructure, 
  detectBaaSRequirement, 
  ensureCompleteViteProject,
  DEFAULT_SUPABASE_CLIENT,
  DEFAULT_LIB_UTILS,
  DEFAULT_TYPES_INDEX
} from '../../sandbox/ProjectStructureDefaults';
import { qaTesterAgent } from '../QATesterAgent';
import { VirtualMultiFileBundler } from '../../sandbox/VirtualMultiFileBundler';

console.log('🧪 Iniciando Test Suite de FASE 5: Pulido de Escalabilidad, Arquitectura Convencional y BaaS (Supabase)...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}${detail ? ` -> ${detail}` : ''}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

// =========================================================================
// BLOQUE 1: Arquitectura de Carpetas Convencional
// =========================================================================
console.log('--- 1. Arquitectura de Carpetas Convencional ---');

const structuredProject = {
  'src/App.tsx': `
    import React, { useState } from 'react';
    import { Navbar } from './components/Navbar';
    import { Dashboard } from './pages/Dashboard';
    import { cn } from './lib/utils';
    import type { UserProfile } from './types';

    export default function App() {
      const [view, setView] = useState('dashboard');
      return (
        <div className={cn("min-h-screen bg-slate-950 text-white")}>
          <Navbar currentView={view} onNavigate={setView} />
          <Dashboard />
        </div>
      );
    }
  `,
  'src/components/Navbar.tsx': `
    import React from 'react';
    import { Sparkles } from 'lucide-react';

    export function Navbar({ currentView, onNavigate }: { currentView: string; onNavigate: (v: string) => void }) {
      return (
        <nav className="h-14 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold">NONA App</span>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="text-sm text-slate-300 hover:text-white">
            Dashboard
          </button>
        </nav>
      );
    }
  `,
  'src/pages/Dashboard.tsx': `
    import React from 'react';
    export function Dashboard() {
      return <div className="p-8"><h1>Panel Principal</h1></div>;
    }
  `,
  'src/lib/utils.ts': DEFAULT_LIB_UTILS,
  'src/types/index.ts': DEFAULT_TYPES_INDEX
};

const analysis = analyzeProjectStructure(structuredProject);

assert(analysis.hasComponents, 'Identifica carpeta convencional src/components/');
assert(analysis.hasPages, 'Identifica carpeta convencional src/pages/');
assert(analysis.hasLib, 'Identifica carpeta convencional src/lib/');
assert(analysis.hasTypes, 'Identifica carpeta convencional src/types/');
assert(analysis.score >= 90, 'Puntuación arquitectónica alta para estructura completa', `Puntuación: ${analysis.score}/100`);

// Caso no estructurado: archivos planos en raíz src/
const flatProject = {
  'src/App.tsx': 'export default function App() { return <div>App</div>; }',
  'src/Card1.tsx': 'export function Card1() { return <div>1</div>; }',
  'src/Card2.tsx': 'export function Card2() { return <div>2</div>; }',
  'src/Card3.tsx': 'export function Card3() { return <div>3</div>; }'
};
const flatAnalysis = analyzeProjectStructure(flatProject);
assert(!flatAnalysis.hasComponents, 'Detecta ausencia de src/components/ en proyecto plano');
assert(!flatAnalysis.hasPages, 'Detecta ausencia de src/pages/');
assert(flatAnalysis.recommendations.some(r => r.includes('src/components/')), 'Genera recomendación para organizar en src/components/');

// =========================================================================
// BLOQUE 2: Detección y Soporte de BaaS (Supabase)
// =========================================================================
console.log('\n--- 2. Detección y Soporte de BaaS (Supabase) ---');

assert(detectBaaSRequirement('Crea una app de tareas con Supabase y base de datos'), 'Detecta "supabase" y "base de datos"');
assert(detectBaaSRequirement('Quiero que se guarden los usuarios registrados'), 'Detecta "guarden los usuarios"');
assert(detectBaaSRequirement('Agrega autenticación con login y persistencia'), 'Detecta "autenticación", "login" y "persistencia"');
assert(detectBaaSRequirement('Crea un sistema de comentarios con tabla SQL'), 'Detecta "tabla" y "sql"');
assert(!detectBaaSRequirement('Cambia el color del botón a verde esmeralda'), 'No activa BaaS para cambios de estilos CSS');
assert(!detectBaaSRequirement('Mueve el contador hacia la izquierda'), 'No activa BaaS para ajustes posicionales de UI');

// Verificación de DEFAULT_SUPABASE_CLIENT
assert(DEFAULT_SUPABASE_CLIENT.includes('createClient'), 'Cliente Supabase utiliza createClient()');
assert(DEFAULT_SUPABASE_CLIENT.includes('@supabase/supabase-js'), 'Importa @supabase/supabase-js');
assert(DEFAULT_SUPABASE_CLIENT.includes('mock-project.supabase.co'), 'Tiene fallback seguro a URL mock para evitar caídas en Sandbox');
assert(DEFAULT_SUPABASE_CLIENT.includes('checkSupabaseConnection'), 'Exporta helper de verificación de conectividad');

// =========================================================================
// BLOQUE 3: Inyección Automática de BaaS y Utilidades en ensureCompleteViteProject
// =========================================================================
console.log('\n--- 3. Inyección Automática de BaaS y Utilidades ---');

const projectNeedingBaaS = {
  'src/App.tsx': `
    import React, { useEffect, useState } from 'react';
    import { supabase } from './lib/supabase';

    export default function App() {
      const [data, setData] = useState([]);
      useEffect(() => {
        supabase.from('items').select('*').then(res => setData(res.data || []));
      }, []);
      return <div>Elementos: {data.length}</div>;
    }
  `
};

const completedProject = ensureCompleteViteProject(projectNeedingBaaS, { includeBaaS: true });

assert(Boolean(completedProject['src/lib/supabase.ts']), 'Inyecta automáticamente src/lib/supabase.ts');
assert(Boolean(completedProject['package.json']), 'Genera package.json');
assert(Boolean(completedProject['vite.config.ts']), 'Genera vite.config.ts con configuración de alias');
assert(Boolean(completedProject['tsconfig.json']), 'Genera tsconfig.json');

const parsedPkg = JSON.parse(completedProject['package.json']);
assert(Boolean(parsedPkg.dependencies['@supabase/supabase-js']), 'package.json incluye @supabase/supabase-js como dependencia');

const parsedTsconfig = JSON.parse(completedProject['tsconfig.json']);
assert(Boolean(parsedTsconfig.compilerOptions.paths['@/*']), 'tsconfig.json contiene configuración de path alias @/*');

// =========================================================================
// BLOQUE 4: Resolución de Alias @/ y Rutas Relativas en QATesterAgent
// =========================================================================
console.log('\n--- 4. Resolución de Alias @/ y Rutas Relativas en QATesterAgent ---');

const projectWithAlias = {
  'src/App.tsx': `
    import React from 'react';
    import { UserAvatar } from '@/components/UserAvatar';
    import { supabase } from '@/lib/supabase';
    import type { UserProfile } from '@/types';

    export default function App() {
      return (
        <div>
          <UserAvatar name="Juan Pérez" />
        </div>
      );
    }
  `,
  'src/components/UserAvatar.tsx': `
    import React from 'react';
    import { cn } from '@/lib/utils';
    export function UserAvatar({ name }: { name: string }) {
      return <div className={cn("w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white")}>{name[0]}</div>;
    }
  `,
  'src/lib/supabase.ts': DEFAULT_SUPABASE_CLIENT,
  'src/lib/utils.ts': DEFAULT_LIB_UTILS,
  'src/types/index.ts': DEFAULT_TYPES_INDEX
};

const validationAlias = qaTesterAgent.validateTypeScriptProject(projectWithAlias);
assert(validationAlias.valid, 'QATesterAgent valida exitosamente proyecto con alias @/');
assert(validationAlias.unresolvedImports.length === 0, 'Cero imports rotos con resolución de alias @/', `Rotos: ${validationAlias.unresolvedImports.length}`);

// Comprobar detección de alias roto
const projectWithBrokenAlias = {
  ...projectWithAlias,
  'src/App.tsx': `
    import React from 'react';
    import { NonExistent } from '@/components/NonExistent';
    export default function App() { return <NonExistent />; }
  `
};
const validationBrokenAlias = qaTesterAgent.validateTypeScriptProject(projectWithBrokenAlias);
assert(!validationBrokenAlias.valid, 'Detecta como inválido un alias @/ apuntando a un archivo inexistente');
assert(validationBrokenAlias.unresolvedImports.some(u => u.importedSpecifier === '@/components/NonExistent'), 'Identifica @/components/NonExistent en unresolvedImports');

// =========================================================================
// BLOQUE 5: Empaquetado Virtual Multi-Archivo con Supabase y Data URIs
// =========================================================================
console.log('\n--- 5. Empaquetado Virtual Multi-Archivo con Supabase y Data URIs ---');

const bundleResult = VirtualMultiFileBundler.bundle(projectWithAlias);

assert(bundleResult.errors.length === 0, 'VirtualMultiFileBundler empaqueta sin errores');
assert(bundleResult.srcDoc.includes('https://esm.sh/@supabase/supabase-js@2.47.10'), 'El import map incluye CDN de @supabase/supabase-js');
assert(bundleResult.srcDoc.includes('"@/components/UserAvatar":'), 'El import map registra alias @/components/UserAvatar');
assert(bundleResult.srcDoc.includes('"@/lib/supabase":'), 'El import map registra alias @/lib/supabase');
assert(bundleResult.srcDoc.includes('"@/lib/utils":'), 'El import map registra alias @/lib/utils');
assert(bundleResult.srcDoc.includes('data:text/javascript;charset=utf-8,'), 'El import map contiene Data URIs para módulos locales');

// =========================================================================
// BLOQUE 6: Transpilación TypeScript con Hooks Genéricos
// =========================================================================
console.log('\n--- 6. Transpilación TypeScript con Hooks Genéricos ---');

const codeWithGenerics = `
  import React, { useState, useRef } from 'react';
  interface Item { id: string; title: string; }

  export function ItemList() {
    const [items, setItems] = useState<Item[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    return <div ref={containerRef}>{items.length} items</div>;
  }
`;

const transpiled = VirtualMultiFileBundler.transpileTypeScript(codeWithGenerics);
assert(!transpiled.includes('useState<Item[]>'), 'Remueve sintaxis genérica de useState<...>');
assert(!transpiled.includes('useRef<HTMLDivElement>'), 'Remueve sintaxis genérica de useRef<...>');
assert(!transpiled.includes('interface Item'), 'Remueve interfaz TypeScript');

// =========================================================================
// RESUMEN FINAL DE LA FASE 5
// =========================================================================
console.log('\n=========================================================================');
console.log(`🎉 RESULTADOS DE FASE 5: ${passedTests} de ${totalTests} pruebas superadas (100%).`);
console.log('Arquitectura convencional, soporte de BaaS con Supabase y resolución de alias @/ verificados.');
console.log('=========================================================================\n');
