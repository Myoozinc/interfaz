import { qaTesterAgent } from '../QATesterAgent';
import { AgentCollaborationCouncil } from '../AgentCollaborationCouncil';

console.log('🧪 Iniciando Test Suite de FASE 4: Validación Real y Autocorrección en Sandbox...\n');

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
// BLOQUE 1: Detección de Imports Relativos Rotos
// =========================================================================
console.log('--- 1. Detección de Imports Relativos Rotos ---');

const filesWithBrokenImport = {
  'src/App.tsx': `
    import React from 'react';
    import { Header } from './components/Header';
    import { formatCurrency } from './utils/formatters';

    export default function App() {
      return <div><Header title={formatCurrency(100)} /></div>;
    }
  `,
  'src/components/Header.tsx': `
    import React from 'react';
    export const Header = ({ title }: { title: string }) => <h1>{title}</h1>;
  `
  // Nota: falta intencionalmente 'src/utils/formatters.ts'
};

const validationBrokenImport = qaTesterAgent.validateTypeScriptProject(filesWithBrokenImport);

assert(!validationBrokenImport.valid, 'Identifica el proyecto como inválido por import roto');
assert(validationBrokenImport.unresolvedImports.length === 1, 'Detecta exactamente 1 import roto', `Detectados: ${validationBrokenImport.unresolvedImports.length}`);
assert(validationBrokenImport.unresolvedImports[0].importedSpecifier === './utils/formatters', 'El import no resuelto es ./utils/formatters');
assert(validationBrokenImport.errors.some(e => e.includes('./utils/formatters')), 'El mensaje de error menciona el archivo faltante');

// =========================================================================
// BLOQUE 2: Detección de Llaves Desbalanceadas y Código Truncado
// =========================================================================
console.log('\n--- 2. Detección de Llaves Desbalanceadas y Código Truncado ---');

const filesWithTruncatedCode = {
  'src/App.tsx': `
    import React, { useState } from 'react';
    export default function App() {
      const [count, setCount] = useState(0);
      function handleIncrement() {
        setCount(c => c + 1);
      // Falta cerrar la función y el componente
  `
};

const validationTruncated = qaTesterAgent.validateTypeScriptProject(filesWithTruncatedCode);

assert(!validationTruncated.valid, 'Identifica el archivo truncado como inválido');
assert(validationTruncated.syntaxErrors.length > 0, 'Registra error de sintaxis por llaves desbalanceadas');
assert(validationTruncated.errors.some(e => e.includes('llave(s) \'{\' sin cerrar')), 'Reporta llaves sin cerrar');

// =========================================================================
// BLOQUE 3: Generación del Prompt de Autocorrección Estructurado
// =========================================================================
console.log('\n--- 3. Generación del Prompt de Autocorrección Estructurado ---');

const correctionPrompt = qaTesterAgent.buildSelfCorrectionPrompt(validationBrokenImport, 2, 3);

assert(correctionPrompt.includes('[CORRECCIÓN TÉCNICA OBLIGATORIA - INTENTO 2/3]'), 'Incluye cabecera obligatoria de reintento');
assert(correctionPrompt.includes('./utils/formatters'), 'Incluye la causa técnica específica en el prompt');
assert(correctionPrompt.includes('"files"'), 'Exige explícitamente el contrato JSON con la clave "files"');

// =========================================================================
// BLOQUE 4: Inyección y Detección de Errores de Runtime en Sandbox
// =========================================================================
console.log('\n--- 4. Inyección y Detección de Errores de Runtime en Sandbox ---');

const validFiles = {
  'src/App.tsx': `
    import React from 'react';
    export default function App() { return <div>Todo OK</div>; }
  `
};

const runtimeError = "TypeError: Cannot read properties of undefined (reading 'map') at TransactionList.tsx:18";
const validationWithRuntime = qaTesterAgent.validateTypeScriptProject(validFiles, [runtimeError]);

assert(!validationWithRuntime.valid, 'Proyecto marcado inválido si hay errores de runtime en sandbox');
assert(validationWithRuntime.runtimeErrors.length === 1, 'Captura el error de runtime');
assert(validationWithRuntime.errors.some(e => e.includes('[Error de Ejecución en Sandbox]')), 'Reporta el error como fallo en sandbox');

// =========================================================================
// BLOQUE 5: Simulación de Autocorrección Exitosa en Bucle de Reintentos
// =========================================================================
console.log('\n--- 5. Simulación de Autocorrección Exitosa ---');

class MockSelfCorrectingProvider {
  private callCount = 0;

  async streamChat(
    _messages: any[],
    onToken: (t: string, full: string) => void
  ): Promise<string> {
    this.callCount++;

    if (this.callCount === 1) {
      // Intento 1: Devuelve código con import roto
      const brokenJson = JSON.stringify({
        files: [
          {
            path: 'src/App.tsx',
            content: `import React from 'react'; import { UserBadge } from './components/UserBadge'; export default function App() { return <UserBadge name="Alice" />; }`
          }
          // Falta src/components/UserBadge.tsx
        ],
        explanation: 'Intento 1 con componente'
      });
      onToken(brokenJson, brokenJson);
      return brokenJson;
    } else {
      // Intento 2: Autocorrige agregando el archivo faltante
      const fixedJson = JSON.stringify({
        files: [
          {
            path: 'src/App.tsx',
            content: `import React from 'react'; import { UserBadge } from './components/UserBadge'; export default function App() { return <UserBadge name="Alice" />; }`
          },
          {
            path: 'src/components/UserBadge.tsx',
            content: `import React from 'react'; export const UserBadge = ({ name }: { name: string }) => <span>{name}</span>;`
          }
        ],
        explanation: 'Intento 2 corregido con UserBadge incluido'
      });
      onToken(fixedJson, fixedJson);
      return fixedJson;
    }
  }

  getCalls() { return this.callCount; }
}

const mockProviderSuccess = new MockSelfCorrectingProvider();
const councilSuccess = new AgentCollaborationCouncil();
(councilSuccess as any).aiProvider = mockProviderSuccess;

async function runSuccessTest() {
  const result = await councilSuccess.executeCollaborativeSynthesis(
    'Crea una app con badge de usuario',
    {
      id: 'proj_1',
      name: 'Test Project',
      description: 'Test Project Description',
      files: {},
      environmentVariables: {},
      framework: 'react-vite',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    () => {},
    { history: [] }
  );

  assert(mockProviderSuccess.getCalls() === 2, 'Se ejecutaron exactamente 2 intentos (1 inicial + 1 reintento con autocorrección)', `Intentos: ${mockProviderSuccess.getCalls()}`);
  assert('src/App.tsx' in result.files && 'src/components/UserBadge.tsx' in result.files, 'El resultado final contiene ambos archivos corregidos', `Archivos: ${Object.keys(result.files).join(', ')}`);
  assert('src/components/UserBadge.tsx' in result.files, 'El archivo faltante fue inyectado en la autocorrección');
  assert(!result.conversationalSummary.includes('Mario Kart'), 'Cero mención a plantillas falsas');
}

// =========================================================================
// BLOQUE 6: Simulación de Fallo Persistente y Comunicación Honesta
// =========================================================================
console.log('\n--- 6. Simulación de Fallo Persistente y Comunicación Honesta ---');

class MockAlwaysFailingProvider {
  private callCount = 0;

  async streamChat(
    _messages: any[],
    onToken: (t: string, full: string) => void
  ): Promise<string> {
    this.callCount++;
    // Siempre devuelve código truncado con llaves abiertas
    const badJson = JSON.stringify({
      files: [
        {
          path: 'src/App.tsx',
          content: 'export default function App() { return <div>Broken'
        }
      ],
      explanation: 'Intento con error persistente'
    });
    onToken(badJson, badJson);
    return badJson;
  }

  getCalls() { return this.callCount; }
}

const mockProviderFail = new MockAlwaysFailingProvider();
const councilFail = new AgentCollaborationCouncil();
(councilFail as any).aiProvider = mockProviderFail;

async function runFailTest() {
  const result = await councilFail.executeCollaborativeSynthesis(
    'Crea una app compleja',
    {
      id: 'proj_2',
      name: 'Fail Project',
      description: 'Fail Project Description',
      files: {},
      environmentVariables: {},
      framework: 'react-vite',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    () => {},
    { history: [] }
  );

  assert(mockProviderFail.getCalls() === 3, 'Agotó exactamente 3 intentos (1 inicial + 2 reintentos)', `Intentos: ${mockProviderFail.getCalls()}`);
  assert(Object.keys(result.files).length === 0, 'No inyectó archivos falsos ni corrompidos', `Archivos: ${Object.keys(result.files).length}`);
  assert(result.fullCode === '', 'fullCode es vacío (no sustituye por HTML hardcodeado)');
  assert(result.conversationalSummary.includes('No fue posible generar la aplicación solicitada'), 'Comunica honestamente el fallo al usuario');
  assert(result.conversationalSummary.includes('Causa detectada:'), 'Explica la causa técnica real al usuario');
  assert(!result.conversationalSummary.includes('Mario Kart') && !result.conversationalSummary.includes('Air Combat'), 'Cero sustitución por plantillas ajenas');
}

// Ejecutar pruebas asíncronas
(async () => {
  await runSuccessTest();
  await runFailTest();

  console.log(`\n================================================================`);
  console.log(`🎯 FASE 4 TEST RESULT: ${passedTests}/${totalTests} pruebas superadas con éxito (100%).`);
  console.log(`================================================================\n`);
})();
