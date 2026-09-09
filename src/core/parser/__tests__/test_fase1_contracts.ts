import { ProjectJSONParser } from '../ProjectJSONParser';
import { ActionStreamParser } from '../ActionStreamParser';

async function runFase1Tests() {
  console.log('================================================================');
  console.log('   FASE 1: VERIFICACIÓN DEL CONTRATO DE SALIDA Y PARSER JSON    ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Full Build Contract (Landing / Auth Form multi-archivo)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: Full Build Contract (App Simple / Formulario) ---');
  const validFullBuildJSON = JSON.stringify({
    files: [
      {
        path: 'src/App.tsx',
        content: `import React from 'react';\nimport { LoginForm } from './components/LoginForm';\n\nexport function App() {\n  return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><LoginForm /></div>;\n}`
      },
      {
        path: 'src/components/LoginForm.tsx',
        content: `import React, { useState } from 'react';\n\nexport function LoginForm() {\n  const [email, setEmail] = useState('');\n  return <form className="p-6 bg-slate-800 rounded-xl"><input value={email} onChange={e => setEmail(e.target.value)} /></form>;\n}`
      },
      {
        path: 'src/index.css',
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`
      }
    ],
    explanation: 'Se construyó una aplicación de login modular con App.tsx, LoginForm.tsx y estilos Tailwind.'
  }, null, 2);

  const res1 = ProjectJSONParser.parseFullBuild(validFullBuildJSON);
  assert(res1.success, 'Parseo exitoso de FullBuildContract');
  if (res1.success) {
    assert(res1.contract.files.length === 3, 'Contiene exactamente 3 archivos en files[]', `Archivos: ${res1.contract.files.map(f => f.path).join(', ')}`);
    assert(res1.contract.files[0].path === 'src/App.tsx', 'Ruta normalizada src/App.tsx');
    assert(res1.contract.explanation.includes('login modular'), 'Explicación conversacional preservada');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Screen Dashboard Full Build (Dashboard Completo)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Full Build Contract (Dashboard Multi-Pantalla) ---');
  const dashboardJSON = `\`\`\`json
{
  "files": [
    {
      "path": "src/App.tsx",
      "content": "import { Sidebar } from './components/Sidebar';\\nimport { StatsView } from './components/StatsView';\\nimport { UsersTable } from './components/UsersTable';\\nexport default function App() { return <div className='flex'>...</div>; }"
    },
    {
      "path": "src/components/Sidebar.tsx",
      "content": "export function Sidebar({ currentTab, onSelectTab }: any) { return <aside>Menu</aside>; }"
    },
    {
      "path": "src/components/StatsView.tsx",
      "content": "export function StatsView() { return <div>Métricas de rendimiento en tiempo real</div>; }"
    },
    {
      "path": "src/components/UsersTable.tsx",
      "content": "export function UsersTable() { return <table><tbody><tr><td>Usuario 1</td></tr></tbody></table>; }"
    },
    {
      "path": "src/index.css",
      "content": "body { margin: 0; font-family: sans-serif; }"
    }
  ],
  "explanation": "Dashboard de administración multi-pantalla con métricas, tabla de usuarios y navegación lateral."
}
\`\`\``;

  const res2 = ProjectJSONParser.parseFullBuild(dashboardJSON);
  assert(res2.success, 'Parseo exitoso de Dashboard en bloque ```json');
  if (res2.success) {
    assert(res2.contract.files.length === 5, 'Contiene 5 archivos modulares para el dashboard');
    assert(res2.contract.explanation.includes('Dashboard de administración'), 'Explicación del dashboard validada');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Incremental Edit Contract (Modificación puntual sin regenerar todo)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Incremental Edit Contract (Edición Incremental) ---');
  const incrementalJSON = JSON.stringify({
    changes: [
      {
        path: 'src/components/LoginForm.tsx',
        action: 'update',
        content: `export function LoginForm() { return <button className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded">Iniciar Sesión Ahora</button>; }`
      },
      {
        path: 'src/components/Toast.tsx',
        action: 'create',
        content: `export function Toast({ message }: { message: string }) { return <div className="fixed bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-lg">{message}</div>; }`
      }
    ],
    explanation: 'Se actualizó el botón de login a color violeta y se creó el componente Toast de notificación.'
  }, null, 2);

  const res3 = ProjectJSONParser.parseIncrementalEdit(incrementalJSON);
  assert(res3.success, 'Parseo exitoso de IncrementalEditContract');
  if (res3.success) {
    assert(res3.contract.changes.length === 2, 'Contiene 2 cambios en changes[]');
    assert(res3.contract.changes[0].action === 'update', 'Cambio 1 es update en LoginForm.tsx');
    assert(res3.contract.changes[1].action === 'create', 'Cambio 2 es create en Toast.tsx');
    assert(res3.contract.explanation.includes('Toast'), 'Explicación de cambios validada');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Resiliencia ante Pensamiento (<think>), texto introductorio y trailing commas
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Resiliencia ante <think>, texto y comas colgantes ---');
  const noisyOutput = `<think>
El usuario quiere una landing page moderna con formulario.
Voy a estructurar en src/App.tsx y src/index.css con Tailwind.
</think>
Por supuesto, aquí tienes el proyecto solicitado:

\`\`\`json
{
  "files": [
    {
      "path": "./src/App.tsx",
      "content": "export default function App() { return <h1>Hola Mundo</h1>; }"
    },
    {
      "path": "src/index.css",
      "content": "/* styles */"
    },
  ],
  "explanation": "Landing page generada limpiamente.",
}
\`\`\`

Espero que te sea de gran utilidad.`;

  const res4 = ProjectJSONParser.parseFullBuild(noisyOutput);
  assert(res4.success, 'Extracción y reparación de JSON con <think> y comas colgantes');
  if (res4.success) {
    assert(res4.contract.files.length === 2, 'Extrajimos 2 archivos a pesar del ruido y <think>');
    assert(res4.contract.files[0].path === 'src/App.tsx', 'Ruta ./src/App.tsx normalizada a src/App.tsx');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Detección estricta de fallo (Cero fallbacks silenciosos a plantillas)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Detección estricta de fallo (Sin plantillas falsas) ---');
  const brokenOutput = `<think>pensando...</think>
Lo siento, no pude completar el archivo de código:
{
  "files": [
    { "path": "src/App.tsx" }
  ]
}`;

  const res5 = ProjectJSONParser.parse(brokenOutput);
  assert(!res5.success, 'Fallo detectado correctamente ante JSON incompleto (falta content)');
  if (!res5.success) {
    assert(res5.error.includes('content'), 'Error técnico específico devuelto al orquestador', `Error: ${res5.error}`);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Integración con ActionStreamParser
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Integración transparente con ActionStreamParser ---');
  const actionParsed = ActionStreamParser.parse(validFullBuildJSON);
  assert(Object.keys(actionParsed.files).length === 3, 'ActionStreamParser extrae archivos del contrato JSON');
  assert(actionParsed.files['src/App.tsx'] !== undefined, 'Archivo src/App.tsx accesible en actionParsed.files');
  assert(actionParsed.conversationalSummary.includes('login modular'), 'Conversational summary mapeado desde explanation');

  console.log('\n================================================================');
  console.log(`   RESULTADOS DE FASE 1: ${passed}/${total} PRUEBAS EXITOSAS (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runFase1Tests().catch(err => {
  console.error('Error fatal ejecutando pruebas de Fase 1:', err);
  process.exit(1);
});
