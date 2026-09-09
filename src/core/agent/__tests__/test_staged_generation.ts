import { 
  AgentCollaborationCouncil, 
  detectBaaSRequirement, 
  extractRelativeComponentImports 
} from '../AgentCollaborationCouncil';
import { qaTesterAgent } from '../QATesterAgent';
import { VirtualMultiFileBundler } from '../../sandbox/VirtualMultiFileBundler';
import type { FullStackProject } from '../../types';

console.log('🧪 Iniciando Test Suite de GENERACIÓN MULTI-FASE SECUENCIAL (3 Escenarios Reales)...\n');

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
// BLOQUE 1: Verificación de extractRelativeComponentImports
// =========================================================================
console.log('--- 1. Extractor de Componentes Relativos ---');

const sampleAppCode = `
import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { EmailForm } from './components/EmailForm';
import Testimonials from './components/Testimonials';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import './index.css';

export default function App() {
  return <div><Hero /><EmailForm /><Testimonials /></div>;
}
`;

const extracted = extractRelativeComponentImports(sampleAppCode, 'src');
assert(extracted.includes('src/components/Hero.tsx'), 'Detecta src/components/Hero.tsx');
assert(extracted.includes('src/components/EmailForm.tsx'), 'Detecta src/components/EmailForm.tsx');
assert(extracted.includes('src/components/Testimonials.tsx'), 'Detecta src/components/Testimonials.tsx');
assert(!extracted.some(p => p.includes('lib/utils')), 'Omite lib/utils (se maneja en soporte/Fase 3)');
assert(!extracted.some(p => p.includes('lib/supabase')), 'Omite lib/supabase (se maneja en soporte/Fase 3)');
assert(!extracted.some(p => p.endsWith('.css')), 'Omite archivos de estilos CSS');

// =========================================================================
// BLOQUE 2: Detección Condicional de BaaS
// =========================================================================
console.log('\n--- 2. Detección Condicional de Requerimiento BaaS (Supabase) ---');

assert(!detectBaaSRequirement('Landing page para app de productividad con captura de emails y testimonios'), 'Landing no activa BaaS');
assert(!detectBaaSRequirement('Juego 3D en Three.js con aviones y combate en canvas'), 'Juego no activa BaaS');
assert(detectBaaSRequirement('Dashboard SaaS con usuarios y persistencia en base de datos'), 'Persistencia activa BaaS');
assert(detectBaaSRequirement('Sistema de notas que guarde los usuarios en Supabase'), 'Supabase explícito activa BaaS');

// =========================================================================
// BLOQUE 3: ESCENARIO 1 — Landing Page / Formulario Simple
// =========================================================================
console.log('\n--- 3. Escenario 1: Landing Page con Generación Multi-Fase ---');

const emptyProject: FullStackProject = {
  id: 'landing_proj',
  name: 'Productivity Landing',
  description: 'Landing page para productividad',
  files: {},
  environmentVariables: {},
  framework: 'react-vite',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

class MockLandingProvider {
  private callCount = 0;
  public promptsReceived: string[] = [];

  async streamChat(messages: any[], onToken: any): Promise<string> {
    this.callCount++;
    const userMsg = messages[messages.length - 1].content;
    this.promptsReceived.push(userMsg);

    if (this.callCount === 1) {
      // Fase 1: Devuelve index.html y src/App.tsx con imports a Hero y EmailForm
      const p1Response = JSON.stringify({
        files: [
          {
            path: 'index.html',
            content: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>'
          },
          {
            path: 'src/App.tsx',
            content: `import React from 'react';
import { Hero } from './components/Hero';
import { EmailForm } from './components/EmailForm';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Hero />
      <EmailForm />
    </div>
  );
}`
          }
        ],
        explanation: 'Fase 1 completada: Scaffold y raíz App.tsx con Hero y EmailForm.'
      });
      onToken(p1Response, p1Response);
      return p1Response;
    } else if (this.callCount === 2) {
      // Fase 2: Devuelve los componentes solicitados en Fase 1
      const p2Response = JSON.stringify({
        files: [
          {
            path: 'src/components/Hero.tsx',
            content: `import React from 'react';
export function Hero() {
  return (
    <header className="p-12 text-center">
      <h1 className="text-4xl font-bold text-indigo-400">NONA Focus</h1>
      <p className="text-slate-300 mt-2">La herramienta definitiva de productividad.</p>
    </header>
  );
}`
          },
          {
            path: 'src/components/EmailForm.tsx',
            content: `import React, { useState } from 'react';
export function EmailForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="max-w-md mx-auto p-4">
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="tu@email.com"
        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white" 
      />
      <button type="submit" className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 py-2 rounded font-semibold">
        Unirme a la lista
      </button>
      {submitted && <p className="text-emerald-400 mt-2 text-sm">¡Gracias por suscribirte!</p>}
    </form>
  );
}`
          }
        ],
        explanation: 'Fase 2 completada: Componentes Hero y EmailForm interactivos.'
      });
      onToken(p2Response, p2Response);
      return p2Response;
    }
    return '';
  }

  getCalls() { return this.callCount; }
}

const landingProvider = new MockLandingProvider();
const councilLanding = new AgentCollaborationCouncil();
(councilLanding as any).aiProvider = landingProvider;

const landingResult = await councilLanding.executeCollaborativeSynthesis(
  'Landing page para app de productividad con formulario de captura de emails y testimonios',
  emptyProject,
  () => {}
);

assert(landingProvider.getCalls() === 2, 'Escenario 1 ejecutó exactamente 2 fases (Scaffold + Componentes)');
assert('src/App.tsx' in landingResult.files, 'Contiene src/App.tsx');
assert('src/components/Hero.tsx' in landingResult.files, 'Contiene src/components/Hero.tsx');
assert('src/components/EmailForm.tsx' in landingResult.files, 'Contiene src/components/EmailForm.tsx');
assert('index.html' in landingResult.files, 'Contiene index.html');

const qaLanding = qaTesterAgent.validateTypeScriptProject(landingResult.files);
assert(qaLanding.valid, 'El proyecto ensamblado de la landing supera la validación de QATesterAgent sin errores');
assert(qaLanding.unresolvedImports.length === 0, 'Cero imports rotos en la landing');

// =========================================================================
// BLOQUE 4: ESCENARIO 2 — Dashboard SaaS Multi-Pantalla
// =========================================================================
console.log('\n--- 4. Escenario 2: Dashboard SaaS Multi-Pantalla ---');

class MockDashboardProvider {
  private callCount = 0;

  async streamChat(_messages: any[], onToken: any): Promise<string> {
    this.callCount++;

    if (this.callCount === 1) {
      // Fase 1: App.tsx con Sidebar, MetricsView, InvoicesView
      const p1 = JSON.stringify({
        files: [
          {
            path: 'index.html',
            content: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>'
          },
          {
            path: 'src/App.tsx',
            content: `import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricsView } from './components/MetricsView';
import { InvoicesView } from './components/InvoicesView';

export default function App() {
  const [tab, setTab] = useState<'metrics' | 'invoices'>('metrics');
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={tab} onSelectTab={setTab} />
      <main className="flex-1 p-6">
        {tab === 'metrics' ? <MetricsView /> : <InvoicesView />}
      </main>
    </div>
  );
}`
          }
        ],
        explanation: 'Fase 1: Dashboard shell y navegación entre métricas y facturas.'
      });
      onToken(p1, p1);
      return p1;
    } else if (this.callCount === 2) {
      // Fase 2: Componentes modulares
      const p2 = JSON.stringify({
        files: [
          {
            path: 'src/components/Sidebar.tsx',
            content: `import React from 'react';
export function Sidebar({ activeTab, onSelectTab }: { activeTab: string; onSelectTab: (t: any) => void }) {
  return (
    <aside className="w-64 border-r border-slate-800 p-4">
      <h2 className="text-xl font-bold text-indigo-400 mb-6">Finanzas Pro</h2>
      <button onClick={() => onSelectTab('metrics')} className="w-full text-left px-3 py-2 rounded hover:bg-slate-800">Métricas</button>
      <button onClick={() => onSelectTab('invoices')} className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 mt-1">Facturas</button>
    </aside>
  );
}`
          },
          {
            path: 'src/components/MetricsView.tsx',
            content: `import React from 'react';
export function MetricsView() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Resumen de Ingresos</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
          <p className="text-slate-400">Total Facturado</p>
          <p className="text-2xl font-bold text-emerald-400">$45,280 USD</p>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
          <p className="text-slate-400">Pendiente de Cobro</p>
          <p className="text-2xl font-bold text-amber-400">$8,120 USD</p>
        </div>
      </div>
    </div>
  );
}`
          },
          {
            path: 'src/components/InvoicesView.tsx',
            content: `import React from 'react';
export function InvoicesView() {
  const invoices = [
    { id: 'INV-001', client: 'Acme Corp', amount: '$3,500', status: 'Pagado' },
    { id: 'INV-002', client: 'Globex Inc', amount: '$1,200', status: 'Pendiente' }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lista de Facturas</h1>
      <table className="w-full text-left bg-slate-900 rounded overflow-hidden">
        <thead className="bg-slate-800 text-slate-300">
          <tr><th className="p-3">ID</th><th className="p-3">Cliente</th><th className="p-3">Monto</th><th className="p-3">Estado</th></tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} className="border-t border-slate-800">
              <td className="p-3">{inv.id}</td>
              <td className="p-3">{inv.client}</td>
              <td className="p-3">{inv.amount}</td>
              <td className="p-3"><span className="text-emerald-400">{inv.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`
          }
        ],
        explanation: 'Fase 2: Sidebar, MetricsView e InvoicesView completamente implementados.'
      });
      onToken(p2, p2);
      return p2;
    }
    return '';
  }

  getCalls() { return this.callCount; }
}

const dashboardProvider = new MockDashboardProvider();
const councilDashboard = new AgentCollaborationCouncil();
(councilDashboard as any).aiProvider = dashboardProvider;

const dashResult = await councilDashboard.executeCollaborativeSynthesis(
  'Dashboard SaaS de finanzas con 3 pantallas: resumen de ingresos, lista de facturas y configuración',
  emptyProject,
  () => {}
);

assert(dashboardProvider.getCalls() === 2, 'Dashboard ejecutó 2 llamadas modulares');
assert(Object.keys(dashResult.files).length >= 5, 'Dashboard cuenta con al menos 5 archivos modulares', `Archivos: ${Object.keys(dashResult.files).join(', ')}`);
assert('src/components/Sidebar.tsx' in dashResult.files, 'Contiene Sidebar.tsx');
assert('src/components/MetricsView.tsx' in dashResult.files, 'Contiene MetricsView.tsx');
assert('src/components/InvoicesView.tsx' in dashResult.files, 'Contiene InvoicesView.tsx');

const qaDashboard = qaTesterAgent.validateTypeScriptProject(dashResult.files);
assert(qaDashboard.valid, 'El Dashboard completo supera la validación de QA');
assert(qaDashboard.syntaxErrors.length === 0, 'Cero errores de sintaxis en Dashboard');

// Empaquetado virtual sin caídas
const bundleDashboard = VirtualMultiFileBundler.bundle(dashResult.files);
assert(bundleDashboard.errors.length === 0, 'VirtualMultiFileBundler empaqueta el Dashboard exitosamente sin errores');
assert(bundleDashboard.transpiledFilesCount >= 4, 'Transpiló al menos 4 archivos TSX');

// =========================================================================
// BLOQUE 5: ESCENARIO 3 — App con Persistencia Supabase BaaS
// =========================================================================
console.log('\n--- 5. Escenario 3: App con Persistencia Supabase BaaS ---');

class MockSupabaseAppProvider {
  private callCount = 0;
  public systemPromptsReceived: string[] = [];

  async streamChat(messages: any[], onToken: any): Promise<string> {
    this.callCount++;
    this.systemPromptsReceived.push(messages[0].content);

    if (this.callCount === 1) {
      // Fase 1: App con TaskList y cliente Supabase
      const p1 = JSON.stringify({
        files: [
          {
            path: 'index.html',
            content: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>'
          },
          {
            path: 'src/App.tsx',
            content: `import React, { useState } from 'react';
import { TaskList } from './components/TaskList';
import { supabase } from './lib/supabase';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold text-indigo-400">Mis Tareas en Supabase</h1>
      <TaskList />
    </div>
  );
}`
          }
        ],
        explanation: 'Fase 1: App principal con integración Supabase.'
      });
      onToken(p1, p1);
      return p1;
    } else if (this.callCount === 2) {
      // Fase 2: TaskList
      const p2 = JSON.stringify({
        files: [
          {
            path: 'src/components/TaskList.tsx',
            content: `import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function TaskList() {
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([
    { id: '1', title: 'Aprender NONA' },
    { id: '2', title: 'Desplegar en Vercel' }
  ]);
  const [newTitle, setNewTitle] = useState('');

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, { id: String(Date.now()), title: newTitle }]);
    setNewTitle('');
  };

  return (
    <div className="max-w-md mt-6">
      <div className="flex gap-2">
        <input 
          value={newTitle} 
          onChange={(e) => setNewTitle(e.target.value)} 
          placeholder="Nueva tarea..."
          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded" 
        />
        <button onClick={addTask} className="bg-indigo-600 px-4 py-2 rounded">Agregar</button>
      </div>
      <ul className="mt-4 space-y-2">
        {tasks.map(t => (
          <li key={t.id} className="p-3 bg-slate-900 border border-slate-800 rounded">{t.title}</li>
        ))}
      </ul>
    </div>
  );
}`
          }
        ],
        explanation: 'Fase 2: TaskList con interacción completa.'
      });
      onToken(p2, p2);
      return p2;
    } else if (this.callCount === 3) {
      // Fase 3: Cliente Supabase
      const p3 = JSON.stringify({
        files: [
          {
            path: 'src/lib/supabase.ts',
            content: `// CREATE TABLE tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL);
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-nona';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
          }
        ],
        explanation: 'Fase 3: Cliente Supabase configurado con fallback mock seguro.'
      });
      onToken(p3, p3);
      return p3;
    }
    return '';
  }

  getCalls() { return this.callCount; }
}

const supabaseAppProvider = new MockSupabaseAppProvider();
const councilSupabase = new AgentCollaborationCouncil();
(councilSupabase as any).aiProvider = supabaseAppProvider;

const supaResult = await councilSupabase.executeCollaborativeSynthesis(
  'Sistema de tareas y notas que guarde los usuarios y sus listas en Supabase con base de datos',
  emptyProject,
  () => {}
);

assert(supabaseAppProvider.getCalls() === 3, 'Escenario 3 ejecutó las 3 fases (Scaffold + Componentes + BaaS)');
assert('src/lib/supabase.ts' in supaResult.files, 'Contiene src/lib/supabase.ts');
assert(supaResult.files['src/lib/supabase.ts'].includes('@supabase/supabase-js'), 'src/lib/supabase.ts importa @supabase/supabase-js');
assert('src/components/TaskList.tsx' in supaResult.files, 'Contiene src/components/TaskList.tsx');

// Verificar que el system prompt inyectó las instrucciones de Supabase solo en este escenario
assert(supabaseAppProvider.systemPromptsReceived[0].includes('INTEGRACIÓN BACKEND-AS-A-SERVICE (SUPABASE)'), 'El system prompt incluyó la sección Supabase al detectar BaaS');
assert(!landingProvider.promptsReceived[0]?.includes('INTEGRACIÓN BACKEND-AS-A-SERVICE (SUPABASE)'), 'La Landing NO recibió instrucciones de Supabase (ahorro de tokens)');

const qaSupa = qaTesterAgent.validateTypeScriptProject(supaResult.files);
assert(qaSupa.valid, 'El proyecto con Supabase supera QA completamente');
assert(qaSupa.unresolvedImports.length === 0, 'Todos los imports de Supabase resuelven sin error');

console.log(`\n================================================================`);
console.log(`🎯 STAGED GENERATION TEST RESULT: ${passedTests}/${totalTests} pruebas superadas con éxito (100%).`);
console.log(`================================================================\n`);
